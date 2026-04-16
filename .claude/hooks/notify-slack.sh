#!/bin/bash
# Claude Code 작업 완료 시 Slack 알림 전송

INPUT=$(cat)

# stop_hook_active 체크: 무한 루프 방지 (필수)
STOP_HOOK_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false')
if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
  exit 0
fi

# 프로젝트 .env 파일에서 SLACK_WEBHOOK_URL 로드
# $CLAUDE_PROJECT_DIR은 Claude Code가 훅 실행 시 자동으로 주입하는 환경 변수
ENV_FILE="$CLAUDE_PROJECT_DIR/.env"
if [ -f "$ENV_FILE" ]; then
  SLACK_WEBHOOK_URL=$(grep '^SLACK_WEBHOOK_URL=' "$ENV_FILE" | cut -d '=' -f2-)
fi

# Slack Webhook URL 확인
if [ -z "$SLACK_WEBHOOK_URL" ]; then
  echo "SLACK_WEBHOOK_URL이 .env에 설정되지 않았습니다." >&2
  exit 0
fi

# 컨텍스트 정보 추출
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"')
CWD=$(echo "$INPUT" | jq -r '.cwd // "unknown"')
PROJECT_NAME=$(basename "$CWD")
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# 마지막 사용자 요청 (history.jsonl에서 현재 프로젝트 기준)
LAST_PROMPT=$(jq -r --arg proj "$CWD" \
  'select(.project == $proj) | .display' \
  ~/.claude/history.jsonl 2>/dev/null \
  | grep -v '^$' | tail -1 | cut -c1-300)
if [ -z "$LAST_PROMPT" ]; then
  LAST_PROMPT="정보 없음"
fi

# git 최근 커밋 (최대 3개)
RECENT_COMMITS=$(git -C "$CWD" log --oneline -3 2>/dev/null)
if [ -z "$RECENT_COMMITS" ]; then
  RECENT_COMMITS="커밋 없음"
fi

# git 변경 파일 요약 (작업 중 변경된 파일)
CHANGED_FILES=$(git -C "$CWD" diff --stat HEAD 2>/dev/null | tail -1)
if [ -z "$CHANGED_FILES" ]; then
  CHANGED_FILES=$(git -C "$CWD" status --short 2>/dev/null \
    | grep -v '^$' | head -5 | awk '{print $2}' | tr '\n' ', ' | sed 's/,$//')
fi
if [ -z "$CHANGED_FILES" ]; then
  CHANGED_FILES="변경 없음"
fi

# Slack 메시지 페이로드 구성
PAYLOAD=$(jq -n \
  --arg project "$PROJECT_NAME" \
  --arg cwd "$CWD" \
  --arg session "$SESSION_ID" \
  --arg ts "$TIMESTAMP" \
  --arg prompt "$LAST_PROMPT" \
  --arg commits "$RECENT_COMMITS" \
  --arg files "$CHANGED_FILES" \
  '{
    "username": "Claude Code",
    "icon_url": "https://claude.ai/favicon.ico",
    "text": "✅ Claude Code 작업 완료",
    "blocks": [
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": "✅ Claude Code 작업이 완료되었습니다"
        }
      },
      {
        "type": "section",
        "fields": [
          {
            "type": "mrkdwn",
            "text": ("*프로젝트:*\n" + $project)
          },
          {
            "type": "mrkdwn",
            "text": ("*완료 시각:*\n" + $ts)
          }
        ]
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": ("*📝 마지막 요청:*\n> " + $prompt)
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": ("*📦 최근 커밋:*\n```" + $commits + "```")
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": ("*📁 변경 파일:*\n" + $files)
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "context",
        "elements": [
          {
            "type": "mrkdwn",
            "text": ("세션: `" + $session + "` | 경로: `" + $cwd + "`")
          }
        ]
      }
    ]
  }')

# Slack으로 POST 전송
curl -s -X POST \
  -H 'Content-type: application/json' \
  --data "$PAYLOAD" \
  "$SLACK_WEBHOOK_URL" > /dev/null

exit 0