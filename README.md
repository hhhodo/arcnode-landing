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

## 폰트 (Figma 감지값 그대로)
Pretendard Variable · Chakra Petch · Figtree · Playfair Display(Italic) · Inter · Menlo

## 구조
- `css/styles.css` — 디자인 키트 (수정 금지)
- `css/site.css` — Figma 실측값을 `--fg-*` 커스텀 프로퍼티로 선언 후 사용
- 반응형: 1600 / 1280 / 1024 / 768 단계 축소 (기준은 1920)

## 참고
Figma 원본이 스크롤 연동 사이트 캡처라 카드 4개 중 2개가 중복 복제본이었습니다. 레이아웃(좌·우 교차 배치)은 유지하고 내용만 4개 서로 다르게 작성했습니다. 푸터 로고는 원 브랜드 로고라 텍스트 워드마크로 대체했습니다.

## 배포
`main` 푸시 시 GitHub Actions가 GitHub Pages에 배포합니다.
