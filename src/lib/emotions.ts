export interface EmotionDefinition {
  id: string;
  defaultFile: string;
  patterns: RegExp[];
  label: string;
}

export const DATE_EMOTIONS: readonly EmotionDefinition[] = [
  {
    id: "calm",
    defaultFile: "calm.png",
    patterns: [],
    label: "평온",
  },
  {
    id: "happy",
    defaultFile: "happy.png",
    patterns: [
      /happy|glad|great|nice|wonderful|yay|haha|lol|ㅋㅋ|ㅎㅎ|재밌|좋[아았]|기[쁘분]|웃[기긴]|즐[거겁]/i,
    ],
    label: "기분 좋아~",
  },
  {
    id: "shy",
    defaultFile: "shy.png",
    patterns: [
      /shy|blush|embarrass|fluster|어머|부끄|수줍|얼굴.*빨개|창피|쑥스|민망/i,
    ],
    label: "부끄러워...",
  },
  {
    id: "excited",
    defaultFile: "excited.png",
    patterns: [
      /excited|can't wait|omg|wow|amazing|really|진짜|대박|설레|두근|기대|헐|와[!~]|신[나난]/i,
    ],
    label: "두근두근!",
  },
  {
    id: "jealous",
    defaultFile: "jealous.png",
    patterns: [
      /jealous|envy|who is|another|other girl|other guy|질투|부러|누구|다른.*[여남]|바람/i,
    ],
    label: "질투나...",
  },
  {
    id: "flirty",
    defaultFile: "flirty.png",
    patterns: [
      /flirt|tease|wink|cute|love you|like you|좋아해|사랑|귀여|애교|윙크|자기야|오빠|누나/i,
    ],
    label: "애교~",
  },
  {
    id: "pouty",
    defaultFile: "pouty.png",
    patterns: [
      /hmph|mean|unfair|no fair|ignore|뿌잉|삐졌|서운|섭섭|무시|너무해|싫[어은]/i,
    ],
    label: "삐졌어!",
  },
  {
    id: "loving",
    defaultFile: "loving.png",
    patterns: [
      /love|adore|precious|dear|warm|thank|고마|소중|사랑[해스]|따뜻|감사|행복|함께/i,
    ],
    label: "사랑해♡",
  },
  {
    id: "sleepy",
    defaultFile: "sleepy.png",
    patterns: [
      /sleepy|tired|yawn|night|bed|good night|졸[려림]|피곤|자야|잘게|굿[나밤]|안녕히|나른/i,
    ],
    label: "졸려...",
  },
  {
    id: "surprised",
    defaultFile: "surprised.png",
    patterns: [
      /surprised|shock|what|no way|unbelievable|깜짝|놀[라랐]|헉|엥|뭐[?!]|설마|어[?!]/i,
    ],
    label: "헉!",
  },
  {
    id: "sad",
    defaultFile: "sad.png",
    patterns: [
      /sad|miss you|lonely|cry|tear|upset|속상|슬[퍼픈]|보고.*싶|외로[워운]|울[었고]|눈물|그리[워운]/i,
    ],
    label: "속상해...",
  },
] as const;

export type DateEmotion = (typeof DATE_EMOTIONS)[number]["id"];
export const DATE_EMOTION_IDS = DATE_EMOTIONS.map((e) => e.id);
export const DEFAULT_EMOTION = "calm";

export function detectEmotion(text: string): string {
  for (const def of DATE_EMOTIONS) {
    for (const pattern of def.patterns) {
      if (pattern.test(text)) return def.id;
    }
  }
  return DEFAULT_EMOTION;
}
