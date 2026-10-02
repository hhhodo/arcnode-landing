# ARCNODE — IT 플랫폼 랜딩페이지

Figma `P1anG28riP4wvZWPgkpUcE` 노드 `1247:2`(1920px 프레임)를 그대로 구현하고, 콘텐츠만 IT 주제로 교체한 한 페이지 랜딩입니다.
회색 박스(`.img-slot`)는 모두 이미지 교체 영역입니다 (`#aaa` 1곳, `#d9d9d9` 5곳).

## Variant Memo
typo=loud / image=high / color=accent / radius=sharp(카드·이미지)·round(버튼) / border=hairline / fw=700·400

## Layout Declaration (1920 프레임 실측)
| 섹션 | 구성 | 높이 |
|---|---|---|
| Header | 플로팅 글래스 pill, 좌우 80.64 / 높이 68 / radius 22 | fixed |
| Hero | 마퀴(164.242px) + 원 3개 343.422px (top 482) | 1205 |
| Statement | 176px 3줄 중앙 정렬, 이미지 슬롯 282×326 | 1205 |
| Principles | 카드 480 좌(x167)/우(x1273) 교차, 중앙 이미지 828×879 | 2952 |
| Stats ×3 | 이미지 517×691 중앙, 텍스트 x1288 / x313 / x1288 | 993 ×3 |
| Contact | 타이틀 x480, 컬럼 x1120(800), 고스트 "Say Hello" 200px | 900 |
| Footer | 로고 x216 top304, 하단 바 x216 w1488 | 800 |

## 폰트
- 본문(한글): Pretendard Variable
- 영문(라틴 글자·숫자·기호): **설립체 유건욱** — Chakra Petch를 쓰던 모든 요소(헤더·버튼·마퀴·육각형·라벨·통계·문의 타이틀·푸터 로고)에 한글 포함 적용
- 두 번째 섹션 문장: **설립체 유건욱** — 눈누 CDN(`establishRetrosansOTF.woff`)에서 `@font-face`로 로드. 폰트 파일은 저장소에 포함하지 않음(재배포 금지 라이선스)

## 스크롤 인트로 (`js/main.js`, 장면 높이 600vh / sticky 100vh)
1. 정육각형 3개 — 스크롤하면 이미지가 나타남 (호버 이벤트 없음)
2. 가운데 육각형이 `clip-path` 창으로 커지며 뒤 배경이 드러남
3. 배경이 엘리베이터처럼 위로 올라가며 아래 검정 그라데이션이 드러남
4. 검은 배경에서 문장이 글자 단위로 하나씩 날아옴 (스크롤 연동, 역방향 재생 가능)
- `prefers-reduced-motion` 이면 정적 레이아웃으로 표시
- 이미지 교체 시 `.hex__img`(3개)와 `.reveal__img`(1개)에 같은 이미지를 넣을 것

## 구조
- `css/styles.css` — 디자인 키트 (수정 금지)
- `css/site.css` — Figma 실측값을 `--fg-*` 커스텀 프로퍼티로 선언 후 사용
- 반응형: 1600 / 1280 / 1024 / 768 단계 축소 (기준은 1920)

## 참고
Figma 원본이 스크롤 연동 사이트 캡처라 카드 4개 중 2개가 중복 복제본이었습니다. 레이아웃(좌·우 교차 배치)은 유지하고 내용만 4개 서로 다르게 작성했습니다. 푸터 로고는 원 브랜드 로고라 텍스트 워드마크로 대체했습니다.

## 배포
`main` 푸시 시 GitHub Actions가 GitHub Pages에 배포합니다.

## 컬러
브랜드 액센트: 라임 `#c8ff3d` (`--fg-accent`). 그라데이션 `--fg-grad-mid/--fg-grad-end`는 검정→아주 어두운 올리브.

## Principles / Stats 스크롤
- Principles: 중앙 이미지 `position:sticky`로 고정, 좌우 카드는 스크롤에 따라 이미지 쪽으로 스쳐 지나감 (JS, ≤1024px에서는 비활성)
- 카드 모서리는 `clip-path`로 25px 깎아 포인트 라인과 정확히 맞물림 (배경이 튀어나오지 않음)
- Stats: 400vh 핀 고정 스테이지, 같은 자리에서 이미지·숫자·라벨이 교차 전환
