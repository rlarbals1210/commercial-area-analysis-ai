#!/bin/bash
# 크롤러 감시 래퍼 — 차단 감지 시 자동 재시작
# 실행: bash ai/scripts/crawl_watch.sh

PYTHON=".venv/bin/python3.10"
SCRIPT="ai/scripts/crawl_naver_place.py"
LOG="ai/outputs/crawl_naver_place.log"
BLOCK_EXIT=42
WAIT_SEC=300  # 차단 시 5분 대기 후 재시작

cd "$(dirname "$0")/../.." || exit 1

while true; do
    $PYTHON $SCRIPT >> /dev/null 2>> $LOG
    EXIT_CODE=$?

    if [ $EXIT_CODE -eq 0 ]; then
        echo "$(date '+%H:%M:%S') 크롤링 완료" | tee -a $LOG
        break
    elif [ $EXIT_CODE -eq $BLOCK_EXIT ]; then
        echo "$(date '+%H:%M:%S')   ⏳ ${WAIT_SEC}초 대기 후 자동 재시작..." | tee -a $LOG
        sleep $WAIT_SEC
        echo "$(date '+%H:%M:%S')   🔄 재시작" | tee -a $LOG
    else
        echo "$(date '+%H:%M:%S') 예상치 못한 오류 (exit $EXIT_CODE) — 중단" | tee -a $LOG
        break
    fi
done
