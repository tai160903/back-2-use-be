export interface UploadedUrls {
  topImage?: string;
  bottomImage?: string;
  frontImage?: string;
  backImage?: string;
  leftImage?: string;
  rightImage?: string;
}

export interface DamageFaceInput {
  frontIssue?: string;
  backIssue?: string;
  leftIssue?: string;
  rightIssue?: string;
  topIssue?: string;
  bottomIssue?: string;
}

export function buildCurrentDamageFaces(dto: DamageFaceInput) {
  const map = [
    { face: 'front', issue: dto.frontIssue },
    { face: 'back', issue: dto.backIssue },
    { face: 'left', issue: dto.leftIssue },
    { face: 'right', issue: dto.rightIssue },
    { face: 'top', issue: dto.topIssue },
    { face: 'bottom', issue: dto.bottomIssue },
  ];

  return map
    .filter((d) => d.issue)
    .map((d) => ({ face: d.face, issue: d.issue }));
}

export function buildConditionImageObject(uploaded: UploadedUrls = {}) {
  return {
    topImage: uploaded.topImage || null,
    bottomImage: uploaded.bottomImage || null,
    frontImage: uploaded.frontImage || null,
    backImage: uploaded.backImage || null,
    leftImage: uploaded.leftImage || null,
    rightImage: uploaded.rightImage || null,
  };
}
