-- 복합 인덱스 (통합카테고리, 기준_년분기_코드) 효과 측정
-- 실행: psql -U commercial_user -d commercial_db -f scripts/measure_index.sql > result.txt 2>&1
-- 대상 쿼리: backend/analysis/views.py 의 업종×최신 분기 조회(추천·적합도 점수의 정규화 최댓값 계산)
--   SELECT "총유동인구","점포수","업종_포화도" FROM analysis_commercialdata
--   WHERE "통합카테고리" = :업종 AND "기준_년분기_코드" = :최신분기
-- 방법: 조건 4가지(A 기존 인덱스 / B 기존+복합 / C 보조 인덱스 없음 / D 복합만)마다
--       전체 업종 × 5회를 EXPLAIN (ANALYZE)로 실행해 Execution Time을 모은다(업종별 1회 예열 후 측정).
-- 안전: 인덱스 추가·삭제는 모두 BEGIN … ROLLBACK 안에서만 한다. 스크립트가 끝나면 DB는 실행 전과 같다.
--       (실행 중에는 테이블에 잠금이 걸리므로 앱을 켜 둔 상태에서는 돌리지 않는다.)

\set ON_ERROR_STOP on
\pset pager off
\timing off

\echo '===== 1. 환경 ====='
SELECT version();
SELECT now() AS measured_at;
SELECT count(*) AS total_rows,
       pg_size_pretty(pg_relation_size('analysis_commercialdata')) AS table_size,
       (SELECT max("기준_년분기_코드") FROM analysis_commercialdata) AS latest_quarter,
       (SELECT count(DISTINCT "통합카테고리") FROM analysis_commercialdata) AS categories
FROM analysis_commercialdata;
SELECT count(*) AS rows_in_latest_quarter
FROM analysis_commercialdata
WHERE "기준_년분기_코드" = (SELECT max("기준_년분기_코드") FROM analysis_commercialdata);
SELECT name, setting, unit FROM pg_settings
WHERE name IN ('shared_buffers','work_mem','effective_cache_size','random_page_cost','jit','max_parallel_workers_per_gather')
ORDER BY name;

-- 실행계획 예시에 쓸 최신 분기 값을 변수로 받아 둔다(측정 함수와 같은 리터럴 조건을 쓰기 위해)
SELECT max("기준_년분기_코드") AS latest FROM analysis_commercialdata \gset

\echo '===== 2. 실행 전 인덱스 목록 ====='
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'analysis_commercialdata' ORDER BY indexname;

-- 측정 함수(세션 임시). 조건 이름을 받아 전체 업종 × reps회 측정 결과 한 줄을 돌려준다.
CREATE OR REPLACE FUNCTION pg_temp.measure(cond text, reps int DEFAULT 5)
RETURNS TABLE(condition text, runs int, avg_ms numeric, median_ms numeric, p95_ms numeric,
              min_ms numeric, max_ms numeric, plan_nodes text, indexes_used text)
LANGUAGE plpgsql AS $$
DECLARE
  latest int;
  cat text;
  j jsonb;
  q text;
  times float8[] := '{}';
  nodes text[] := '{}';
  idxs text[] := '{}';
  i int;
BEGIN
  SELECT max("기준_년분기_코드") INTO latest FROM analysis_commercialdata;
  q := 'SELECT "총유동인구","점포수","업종_포화도" FROM analysis_commercialdata '
    || 'WHERE "통합카테고리" = %L AND "기준_년분기_코드" = %s';
  -- 예열: 업종마다 1회 실행(측정에 넣지 않음)
  FOR cat IN SELECT DISTINCT "통합카테고리" FROM analysis_commercialdata ORDER BY 1 LOOP
    EXECUTE 'EXPLAIN (ANALYZE, FORMAT JSON) ' || format(q, cat, latest) INTO j;
  END LOOP;
  FOR i IN 1..reps LOOP
    FOR cat IN SELECT DISTINCT "통합카테고리" FROM analysis_commercialdata ORDER BY 1 LOOP
      EXECUTE 'EXPLAIN (ANALYZE, FORMAT JSON) ' || format(q, cat, latest) INTO j;
      times := times || (j->0->>'Execution Time')::float8;
      nodes := nodes || ARRAY(SELECT DISTINCT x #>> '{}' FROM jsonb_path_query(j, '$.**."Node Type"') x);
      idxs  := idxs  || ARRAY(SELECT DISTINCT x #>> '{}' FROM jsonb_path_query(j, '$.**."Index Name"') x);
    END LOOP;
  END LOOP;
  RETURN QUERY
  SELECT cond,
         cardinality(times),
         round(avg(t)::numeric, 3),
         round((percentile_cont(0.5)  WITHIN GROUP (ORDER BY t))::numeric, 3),
         round((percentile_cont(0.95) WITHIN GROUP (ORDER BY t))::numeric, 3),
         round(min(t)::numeric, 3),
         round(max(t)::numeric, 3),
         (SELECT string_agg(DISTINCT n, ', ' ORDER BY n) FROM unnest(nodes) n),
         coalesce((SELECT string_agg(DISTINCT n, ', ' ORDER BY n) FROM unnest(idxs) n), '(없음)')
  FROM unnest(times) t;
END $$;

-- 보조 인덱스(기본키 제외)를 모두 지우는 함수. 반드시 트랜잭션 안에서만 부른다.
CREATE OR REPLACE FUNCTION pg_temp.drop_secondary() RETURNS void LANGUAGE plpgsql AS $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.relname FROM pg_index i
    JOIN pg_class c ON c.oid = i.indexrelid
    WHERE i.indrelid = 'analysis_commercialdata'::regclass AND NOT i.indisprimary
  LOOP
    EXECUTE format('DROP INDEX %I', r.relname);
  END LOOP;
END $$;

\echo '===== 3. 조건별 측정 (전체 업종 × 5회) ====='

\echo '--- A. 기존 인덱스만 (복합 인덱스 없음) ---'
BEGIN;
DROP INDEX IF EXISTS cd_cat_quarter_idx;
SELECT * FROM pg_temp.measure('A 기존 인덱스');
\echo '[A 실행계획 예시: 카페]'
EXPLAIN (ANALYZE, BUFFERS)
SELECT "총유동인구","점포수","업종_포화도" FROM analysis_commercialdata
WHERE "통합카테고리" = '카페' AND "기준_년분기_코드" = :latest;
ROLLBACK;

\echo '--- B. 기존 인덱스 + 복합 인덱스 ---'
BEGIN;
DROP INDEX IF EXISTS cd_cat_quarter_idx;
CREATE INDEX cd_cat_quarter_idx ON analysis_commercialdata ("통합카테고리", "기준_년분기_코드");
SELECT * FROM pg_temp.measure('B 기존+복합');
\echo '[B 실행계획 예시: 카페]'
EXPLAIN (ANALYZE, BUFFERS)
SELECT "총유동인구","점포수","업종_포화도" FROM analysis_commercialdata
WHERE "통합카테고리" = '카페' AND "기준_년분기_코드" = :latest;
ROLLBACK;

\echo '--- C. 보조 인덱스 없음 (기본키만) ---'
BEGIN;
SELECT pg_temp.drop_secondary();
SELECT * FROM pg_temp.measure('C 보조 인덱스 없음');
\echo '[C 실행계획 예시: 카페]'
EXPLAIN (ANALYZE, BUFFERS)
SELECT "총유동인구","점포수","업종_포화도" FROM analysis_commercialdata
WHERE "통합카테고리" = '카페' AND "기준_년분기_코드" = :latest;
ROLLBACK;

\echo '--- D. 복합 인덱스만 ---'
BEGIN;
SELECT pg_temp.drop_secondary();
CREATE INDEX cd_cat_quarter_idx ON analysis_commercialdata ("통합카테고리", "기준_년분기_코드");
SELECT * FROM pg_temp.measure('D 복합만');
\echo '[D 실행계획 예시: 카페]'
EXPLAIN (ANALYZE, BUFFERS)
SELECT "총유동인구","점포수","업종_포화도" FROM analysis_commercialdata
WHERE "통합카테고리" = '카페' AND "기준_년분기_코드" = :latest;
ROLLBACK;

\echo '===== 4. 실행 후 인덱스 목록 (2번과 같아야 한다) ====='
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'analysis_commercialdata' ORDER BY indexname;
\echo '===== 끝 ====='
