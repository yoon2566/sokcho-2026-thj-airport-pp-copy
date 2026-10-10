# AIRPORT P.P

속초고 2026 게임 수정 수업용 프로토타입입니다. 학생 번호 17의 게임입니다.

## 받기와 실행

~~~powershell
git clone https://github.com/yoon2566/sokcho-2026-17-airport-pp.git
cd sokcho-2026-17-airport-pp
opencode
~~~

Git과 OpenCode를 미리 설치하고 OpenCode의 AI 모델을 연결합니다. index.html을 Chrome 또는 Edge로 열어 플레이합니다. 실행에 필요한 자산을 HTML에 포함했으며 별도 서버 없이 실행하도록 제작했습니다.

## 수정할 파일

`source.template.html`은 화면·스타일과 빈 자리(토큰)만 담고, 게임 코드는 `src/` 폴더에 기능별로 나뉘어 있습니다. `scripts.json`의 순서대로 파일을 이어 붙여 하나의 HTML로 만듭니다.

- `src/00-core.js`: 부팅, 렌더러/씬, 공용 상태와 유틸, 사운드
- `src/10-assets.js`: GLB 자산 로딩과 리깅
- `src/20-environment.js`: 날씨, 공항·활주로·조명
- `src/30-flight-model.js`: 6자유도 계열 비행 모델(양력·항력·실속·측풍)
- `src/40-autopilot.js`: MCP(SPD/HDG/ALT/VS) 오토파일럿과 플라이트 디렉터
- `src/50-instruments.js`: PFD·EICAS 계기와 경고
- `src/60-drone.js`: 드론 링 코스 미션
- `src/70-ui.js`: 메뉴/HUD/미니맵/결과/기록
- `src/80-main.js`: 입력 바인딩, 텔레메트리, 메인 루프
- `assets/`: 원본 게임의 모델 또는 스프라이트
- `assets.json`: 자산 이름과 저장소 안의 경로
- `build.ps1`: 수정한 소스를 실행용 HTML로 묶는 도구
- `index.html`: 최종 실행 파일

vendor 폴더가 있는 게임은 실행 라이브러리와 Three.js 라이선스가 포함됩니다. 라이브러리를 직접 수정할 필요는 없습니다.

수정 후 프로젝트 폴더에서 다음 명령으로 index.html을 다시 만듭니다. Python 설치는 필요하지 않습니다.

~~~powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\build.ps1
~~~

## 추가된 시뮬레이터 기능

- **비행 모델**: 양력·항력·추력·중량, 받음각/실속, 측풍·난류, 난이도 3단계(아케이드/표준/리얼리스틱)
- **오토파일럿**: MCP 패널(AP/FD/SPD/HDG/ALT/VS), 플라이트 디렉터, 수동 입력 시 자동 해제
- **계기**: PFD(자세·속도·고도·VSI·헤딩·ILS), EICAS(N1/EGT/연료/AOA/G/플랩/기어), GPWS 콜아웃
- **조종면·도어**: 에일러론/엘리베이터/러더/플랩 실제 노드 구동, 캐빈도어 개폐, 3D 조종석 자세계 연동
- **야간·조명**: 시간대(낮/황혼/야간), 활주로·램프·캐빈 창·착륙등 점등
- **ATC 통신**: 단계별 관제 메시지와 Enter 복창, 재송신, 무전 로그
- **고장·비상**: 엔진 고장(활공)/유압 저하(조작 지연)/계기 고장(ADC FAIL), 접근 불안정 시 복행
- **리플레이·디브리핑**: 속도/고도/V/S 그래프, 궤적 리플레이, 최근 기록 저장

## 자체 점검

`index.html?selftest`로 열면 순수 함수 테스트와 이륙→오토파일럿→착륙→하차 자동 시나리오 결과가 화면에 표시됩니다. 브라우저 콘솔의 `window.__pilotEvidence`로 비행 상태를, `window.__pilotRules`로 검증 함수를 확인할 수 있습니다.

## OpenCode에 요청하기

~~~text
README.md와 src 폴더를 읽고 게임 구조와 조작 방법을 설명해 줘.
이번에는 내가 원하는 기능 하나만 수정해 줘.
수정한 뒤 build.ps1로 index.html을 다시 만들고, ?selftest로 자체 점검해 줘.
~~~

기존 HTML 프로토타입을 수업용으로 옮겼습니다. 최신 훈위안 리깅 통합본은 아닙니다. 제출 주소는 수업 노션에서 안내합니다.
