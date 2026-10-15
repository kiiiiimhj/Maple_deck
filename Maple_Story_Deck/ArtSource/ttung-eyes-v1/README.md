# 뚱땅 눈 보정

왼쪽 눈 안의 큰 크림색 줄을 없애고, 어두운 동공·파란 홍채·작은 반사광으로 정리했습니다. 오른쪽 홍채와 다른 눈 뜬 표정도 파란 계열로 맞췄습니다.

내장 ImageGen으로 [눈 부분 원화](outputs/eye-detail-guide.png)를 수정했습니다. 게임에는 그 원화 전체를 넣지 않고, 눈 안쪽만 원래 이미지의 픽셀 좌표에 맞춰 분리해 적용했습니다. 서기·걷기·목욕 후 눈 뜨기에는 동일한 눈 수정본을 사용하고, 다른 표정은 기존 눈 모양을 유지하며 홍채 색만 맞췄습니다. 눈을 감는 프레임은 기존 이미지 그대로입니다.

최종 등록 이미지 55개는 [asset-specs.json](outputs/asset-specs.json)에 지정되어 있습니다. 최종 원본 프레임과 이미지 연결은 [base-frames.json](outputs/base-frames.json), 기존 리소스와 새 리소스의 대응은 [ruid-remap.json](outputs/ruid-remap.json)에 있습니다. 같은 이름의 이전 후보 이미지 대신 이 목록에 있는 파일을 사용합니다.

모든 몸 이미지의 알파와 외곽선, 먹이 그릇, 눈 바깥의 몸 그림을 유지했습니다. 기존 모자·옷·목걸이는 같은 독립 이미지로 표시하며, 능력치·애니메이션 속도·프레임 순서는 그대로입니다.

## 실제 확인 화면

- [최종 눈 실제 메이커 화면](outputs/actual-idle-final.png)
- [첫 스킬 사용 화면](outputs/gear-cast-1-phase-1.png)
- [스킬 재사용 화면](outputs/gear-cast-2-phase-1.png)
- [실제 적용된 눈 비교](outputs/actual-eye-comparison.png)

## 제작 프롬프트

- [첫 전체 이미지 수정 프롬프트](outputs/prompt.txt)
- [최종 눈 안쪽 수정 프롬프트](outputs/detail-prompt.txt)

제작 도구는 내장 ImageGen입니다. 원본과 장비 이미지를 유지하기 위해 원화에서 눈 부분을 분리하고 픽셀 위치를 맞춰 준비했습니다.

## 검증 기록

- [프레임별 눈 수정 좌표](outputs/eye-frame-audit.json)
- [최종 이미지 검증](outputs/final-art-verification.json)
- [최종 프레임·깜빡임 확인](outputs/final-runtime-verification.json)
- [실제 첫 스킬 및 재사용 확인](outputs/map-runtime-verification.json)

확인용 임시 계정 상태는 원래 값으로 복원합니다. 개인 진행도 스냅샷은 이 원화 저장본에 포함하지 않습니다.
