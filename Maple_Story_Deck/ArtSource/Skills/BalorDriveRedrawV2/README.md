# 발로르 드라이브 그림 수정 v2

실제 적용 프로젝트: `G:/Maple_Story_Deck`

## 변경

- 볼케닉 드라이브: 검은 용암석, 주황 균열, 두꺼운 금테, 붉은 보석이 있는 망치로 교체.
- 클레이셜 드라이브: 두꺼운 푸른 얼음 타격면, 금테, 푸른 보석이 있는 망치로 교체.
- 두 드라이브 아이콘: 밝은 기존 메이플 스킬 바탕과 테두리를 기준으로 새 망치 모양을 반영.
- 홀리 크리티컬: 사용자가 지정한 `128361e7c7f54ec49a7f18c8708ddaf3` 아이콘을 기준으로 칼 자리만 은색 해머로 수정. 편집 영역 밖 799픽셀은 원본과 RGBA가 완전히 같으며, 원본 테두리를 보존했다.

본체 이미지는 104×128px, 실제 무기 그림은 약 92×102~105px다. 손잡이 끝에 회전 기준점(52,8)을 등록했다. 프레임 전환이 위치를 발사점으로 되돌리지 않도록 수정했으며, 같은 본체로 8단계의 반짝임과 회전을 재생한다. 발사 추진·명중·회전 잔상과 전투 수치는 유지한다.

## 이미지

- [본체 비교](hammer-comparison.png)
- [기존 아이콘과 비교](icon-comparison.png)
- [볼케닉 망치](fire-hammer.png), [클레이셜 망치](ice-hammer.png)
- [크리티컬](critical-icon.png), [볼케닉 아이콘](fire-icon.png), [클레이셜 아이콘](ice-icon.png)

## 제작 및 확인

새 망치와 아이콘은 **내장 ImageGen**으로 제작했다. [prompts.json](prompts.json)에 최종 프롬프트와 참고 이미지를 기록했다. 생성 결과의 크기 정리와 원본 아이콘의 편집 영역 밖 픽셀 복원은 기술적 패키징 단계에서 처리했다. [asset-audit.json](asset-audit.json)에 실제 크기와 원본 보존 검사를 기록했다.

[uploaded.json](uploaded.json): 등록한 리소스 식별자. [verification.json](verification.json): 메이커 실제 재생, 좌우 회전, 8프레임 순서, 피벗과 위치 유지, 아이콘·HUD·도감 표시 검사 결과.

원본 및 기록은 `G:/Maple_Story_Deck/ArtSource/Skills/BalorDriveRedrawV2`에도 보관한다.
