# hent-ai-chat — Implementation Seed

## Goal

AI 캐릭터와 1:1 대화하는 채팅 웹앱. 캐릭터의 감정에 따라 이미지가 바뀌고, 캐릭터 고유의 말투로 응답한다. "대화로 스트레스 푸는" date 감성 서비스.

## Architecture

```
[Browser]  ←→  [Cloudflare Pages]  ←→  [LLM Proxy Server]
 Next.js UI      Next.js API Routes       사용자 자체 운영
                 - OAuth (Google/GitHub)
                 - D1 DB (대화 저장)
                 - 감정 분류 (rule-based + LLM)
                 - 캐릭터/프로필 관리
```

### Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS
- **Backend**: Next.js API Routes (Edge Runtime for Cloudflare)
- **Database**: Cloudflare D1 (SQLite at edge) + Drizzle ORM
- **Auth**: NextAuth.js v5 (Google + GitHub OAuth)
- **LLM**: 외부 프록시 서버 호출 (OpenAI-compatible API)
- **Deploy**: Cloudflare Pages + `@cloudflare/next-on-pages`
- **Streaming**: Server-Sent Events (SSE) for LLM response streaming

## Constraints

- Cloudflare Workers 호환 (no Node.js-only APIs in edge routes)
- D1 SQLite (no Postgres/MySQL)
- LLM 프록시 서버 URL은 환경변수로 설정
- 프리셋 캐릭터만 (사용자 생성 없음, MVP)
- 소규모 공개 — 인증 필수

## Data Model

### users
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  provider TEXT NOT NULL,       -- 'google' | 'github'
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### characters (프리셋)
```sql
CREATE TABLE characters (
  id TEXT PRIMARY KEY,           -- slug: 'nibutani', 'gothic-girl'
  name TEXT NOT NULL,            -- '니부타니 시가'
  description TEXT,              -- 캐릭터 설명 (사용자에게 보여줄 용)
  chat_prompt TEXT NOT NULL,     -- 시스템 프롬프트 (페르소나)
  avatar_url TEXT,               -- 기본 아바타 (calm 상태)
  emotion_images TEXT NOT NULL,  -- JSON: {"calm":"url","shy":"url",...}
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### conversations
```sql
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  character_id TEXT NOT NULL REFERENCES characters(id),
  title TEXT,                    -- 자동 생성 or 첫 메시지 요약
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### messages
```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,            -- 'user' | 'assistant'
  content TEXT NOT NULL,
  emotion TEXT,                  -- 감정 분류 결과 (assistant만)
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

## Date Emotions (from Hent-ai)

11종 감정 세트 — 각 캐릭터마다 11장의 감정 이미지:

| id | label | 감지 패턴 예시 |
|---|---|---|
| calm | 평온 | (기본 상태) |
| happy | 기분 좋아~ | 좋아, ㅋㅋ, haha |
| shy | 부끄러워... | 부끄, blush |
| excited | 두근두근! | 설레, 대박, 두근 |
| jealous | 질투나... | 질투, 다른 여/남 |
| flirty | 애교~ | 좋아해, 자기야 |
| pouty | 삐졌어! | 삐졌, 서운, 뿌잉 |
| loving | 사랑해♡ | 사랑, 소중, 고마 |
| sleepy | 졸려... | 졸려, 잘게, 굿밤 |
| surprised | 헉! | 헉, 놀라, 설마 |
| sad | 속상해... | 속상, 슬퍼, 보고싶 |

## Implementation Plan

### Phase 1: Project Setup + Scaffolding

1. Next.js 15 프로젝트 생성 (App Router, TypeScript, Tailwind)
2. `@cloudflare/next-on-pages` 설정
3. Drizzle ORM + D1 바인딩 설정
4. DB 스키마 정의 + 마이그레이션
5. 환경변수 구조 (.dev.vars, wrangler.toml)
6. Hent-ai에서 감정 정의 복사 (src/lib/emotions.ts)

### Phase 2: Authentication

1. NextAuth.js v5 설정 (Edge Runtime 호환)
2. Google OAuth provider
3. GitHub OAuth provider
4. 로그인/로그아웃 UI
5. 세션 미들웨어 (인증된 사용자만 접근)

### Phase 3: Character System

1. 프리셋 캐릭터 DB seed 스크립트
2. 캐릭터 선택 UI (목록 + 프로필 카드)
3. 캐릭터별 감정 이미지 에셋 (11장 x N캐릭터)
4. `/api/characters` — 캐릭터 목록 API

### Phase 4: Chat Engine (핵심)

1. `/api/chat` — 대화 생성 API
   - 사용자 메시지 저장
   - 캐릭터의 chat_prompt를 시스템 프롬프트로 설정
   - 대화 히스토리 (최근 N개 메시지) 포함
   - LLM 프록시 서버에 스트리밍 요청
   - 응답 스트리밍 (SSE)
   - 응답 완료 후 감정 분류 (rule-based 우선, LLM 폴백)
   - assistant 메시지 + 감정 DB 저장

2. `/api/conversations` — 대화 목록/생성/삭제
3. `/api/conversations/[id]/messages` — 메시지 히스토리

### Phase 5: Chat UI

1. 채팅 레이아웃 (사이드바: 대화 목록 + 메인: 채팅)
2. 메시지 버블 (사용자: 오른쪽, 캐릭터: 왼쪽)
3. 캐릭터 감정 이미지 표시 (메시지 옆 또는 상단에 큰 이미지)
4. 스트리밍 응답 표시 (타이핑 효과)
5. 감정 전환 시 이미지 애니메이션 (fade/slide)
6. 대화 시작 시 캐릭터 선택 화면
7. 모바일 반응형

### Phase 6: Polish + Deploy

1. Cloudflare Pages 배포 설정
2. 에러 핸들링 + 로딩 상태
3. Rate limiting (D1 기반 or Cloudflare 기능)
4. OG 메타 + favicon
5. README 작성

## Acceptance Criteria

1. Google/GitHub 로그인 후 캐릭터 선택 → 대화 시작이 동작한다
2. 캐릭터가 chat_prompt 페르소나에 맞는 말투로 응답한다
3. 응답이 스트리밍으로 표시된다 (타이핑 효과)
4. 응답 완료 후 감정이 분류되고, 해당 감정 이미지가 표시된다
5. 대화 기록이 서버에 저장되고, 재접속 시 이어서 대화할 수 있다
6. 11종 감정 이미지가 모두 올바르게 표시된다
7. Cloudflare Pages에 배포되어 외부 접속이 가능하다
8. 모바일에서도 사용 가능한 반응형 UI이다
9. LLM 프록시 서버 URL을 환경변수로 설정할 수 있다
10. 인증되지 않은 사용자는 채팅에 접근할 수 없다

## QA Scenarios

### QA-1: 인증 흐름
- Google 로그인 → 대시보드 진입 → users 테이블에 레코드 생성 확인
- 비로그인 상태에서 /chat 접근 → 로그인 페이지 리다이렉트

### QA-2: 캐릭터 선택
- /characters → 프리셋 캐릭터 목록 표시
- 캐릭터 클릭 → 새 대화 생성 → 채팅 화면 진입
- conversations 테이블에 레코드 생성 확인

### QA-3: 대화 + 감정 이미지
- 메시지 전송 → 스트리밍 응답 표시
- 응답 완료 → 감정 분류 → 감정에 맞는 이미지 표시
- "사랑해" 전송 → loving 감정 → loving 이미지 표시
- "삐졌어" 전송 → pouty 감정 → pouty 이미지 표시
- 일반 대화 → calm 기본 이미지

### QA-4: 대화 저장 + 재접속
- 대화 후 페이지 새로고침 → 이전 대화 내용 유지
- 사이드바에서 이전 대화 클릭 → 해당 대화 로드

### QA-5: Cloudflare 배포
- `npx wrangler pages deploy` 성공
- 배포 URL에서 전체 흐름 동작 확인
