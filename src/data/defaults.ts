import { BeatItem, ExpressionItem, SceneConfig, StyleOption } from "../types/story";

export const DEFAULT_EXPRESSIONS: ExpressionItem[] = [
  {
    id: "expr-1",
    expression: "crossed the line",
    meaning: "선을 넘다",
    movie: "Inside Out 2",
  },
  {
    id: "expr-2",
    expression: "spiraling a bit",
    meaning: "생각이 꼬리를 물다",
    movie: "Inside Out 2",
  },
  {
    id: "expr-3",
    expression: "no excuse for",
    meaning: "~에 대해서는 변명의 여지가 없다",
    movie: "Notting Hill",
  },
  {
    id: "expr-4",
    expression: "spick and span",
    meaning: "아주 깔끔한, 단정한",
    movie: "Notting Hill",
  },
  {
    id: "expr-5",
    expression: "feel hurt",
    meaning: "섭섭하다",
    movie: "Minari",
  },
  {
    id: "expr-6",
    expression: "made my whole day",
    meaning: "덕분에 하루 종일 기분이 좋았어",
    movie: "Inside Out 2",
  },
];

export const STYLE_OPTIONS: StyleOption[] = [
  {
    id: "1990s-cel",
    name: "Classic 1990s hand-drawn 2D cel animation",
    description:
      "Expressive big eyes, soft hand-painted watercolor backgrounds, warm golden lighting, and vintage film grain.",
  },
  {
    id: "2d-animation",
    name: "2D animation",
    description:
      "Clean expressive linework, crisp modern cel shading, and bright living room colors.",
  },
  {
    id: "clay",
    name: "Clay",
    description:
      "Warm tactile stop-motion matte tones, soft sculpted depth, and gentle frame warmth.",
  },
  {
    id: "watercolor",
    name: "Watercolor",
    description:
      "Soft translucent pastel washes, delicate paper grain, and dreamy sunlit edges.",
  },
  {
    id: "live-action",
    name: "Live-action style",
    description:
      "Naturalistic cinema color grading, warm lens bloom, and subtle widescreen depth.",
  },
];

export const CHARACTER_SHEET_IMAGE =
  "/src/assets/images/master_cast_3d_1795581539757.jpg";

export const MASTER_ROOM_IMAGE =
  "/src/assets/images/master_room_3d_1795581539307.jpg";

export const DEFAULT_SCENE: SceneConfig = {
  place:
    "A cozy apartment living room in high-budget theatrical 3D animated film style: large sunlit window with sheer white curtains on the left, beige fabric sofa in the center, light oak wooden floor, and wooden front door on the right",
  characters:
    "20-year-old Korean female college student (shoulder-length straight dark brown hair with see-through bangs, pastel yellow knit sweater, blue jeans, white sneakers; white apron in Beat 3), small beagle-mix puppy Cooper (floppy brown ears, white forehead blaze, red collar), and Mom (neat low bun, navy cardigan over white blouse, beige pants)",
  situation:
    "Ten minutes before Mom arrives, Cooper tears up a cushion and covers the living room in mountains of fluff. The student cleans the room at super speed wearing a white apron, but Cooper acts ultra-innocent by Mom's legs while Mom blames the student over one tiny speck of dust.",
  styleId: "1990s-cel",
};

export const BEAT_IMAGES = [
  "/src/assets/images/film3d_beat1_fluff_mountain_1795581562063.jpg",
  "/src/assets/images/film3d_beat2_panic_mess_1795581562467.jpg",
  "/src/assets/images/film3d_beat3_apron_hug_1795581563664.jpg",
  "/src/assets/images/film3d_beat4_scolding_betrayed_1795581564904.jpg",
] as const;

export const DEFAULT_BEATS: BeatItem[] = [
  {
    id: "beat-1",
    timeRange: "0~7s",
    startSec: 0,
    endSec: 7,
    sceneDescription:
      "오른쪽 현관문을 열자마자 거실 바닥과 베이지 소파 전체가 눈처럼 쌓인 하얀 쿠션 솜 산과 찢어진 쿠션 커버로 뒤덮여 있다. 빨간 목줄의 쿠퍼는 솜 더미 한가운데 천진난만하게 앉아 꼬리를 흔들고, 문 앞에 선 주인공은 손을 반쯤 든 채 눈을 동그랗게 뜨고 어이없어하며 당황한다.",
    englishLine:
      "Seriously, Cooper?! Mom's gonna be here in ten minutes, and look at this place—you really crossed the line!",
    subtitles:
      "Seriously, Cooper?! Mom's gonna be here in ten minutes,\nand look at this place—you really crossed the line!",
    koreanSubtitle:
      "진짜냐, 쿠퍼?! 엄마 10분 뒤에 오시는데 이 꼴 좀 봐—너 진짜 선 넘었어!",
    usedExpressions: ["crossed the line"],
    sourceMovies: ["Inside Out 2"],
    imageUrl: BEAT_IMAGES[0],
  },
  {
    id: "beat-2",
    timeRange: "7~15s",
    startSec: 7,
    endSec: 15,
    sceneDescription:
      "솜뭉치가 흩날리는 똑같은 거실 한가운데서 주인공이 두 손으로 머리를 감싸 쥔 채 멘붕에 빠진 코믹한 표정으로 발을 동동 구른다.",
    englishLine:
      "Ugh, I am spiraling a bit right now... Seriously, there is no excuse for this giant mess.",
    subtitles:
      "Ugh, I am spiraling a bit right now...\nSeriously, there is no excuse for this giant mess.",
    koreanSubtitle:
      "으으, 지금 생각이 꼬리를 물고 멘붕 오네... 진짜 이 난장판은 변명의 여지가 없어.",
    usedExpressions: ["spiraling a bit", "no excuse for"],
    sourceMovies: ["Inside Out 2", "Notting Hill"],
    imageUrl: BEAT_IMAGES[1],
  },
  {
    id: "beat-3",
    timeRange: "15~23s",
    startSec: 15,
    endSec: 23,
    sceneDescription:
      "하얀 앞치마를 두르고 빗자루와 먼지털이로 초인적인 속도로 청소를 마친 주인공이 이마의 땀을 닦는다. 그 순간 현관문으로 들어온 엄마가 환하게 웃으며 귀여운 쿠퍼를 따뜻하게 안아 들고, 주인공은 깜짝 놀란다.",
    englishLine:
      "Phew, the room is spick and span! Wait—why are you acting innocent in Mom's arms, Cooper?!",
    subtitles:
      "Phew, the room is spick and span! Wait—why are\nyou acting innocent in Mom's arms, Cooper?!",
    koreanSubtitle:
      "휴, 방이 아주 깔끔해졌어! 잠깐—쿠퍼, 너 왜 엄마 품에서 아무것도 모르는 척 연기하는 건데?!",
    usedExpressions: ["spick and span"],
    sourceMovies: ["Notting Hill"],
    imageUrl: BEAT_IMAGES[2],
  },
  {
    id: "beat-4",
    timeRange: "23~30s",
    startSec: 23,
    endSec: 30,
    sceneDescription:
      "깨끗해진 거실 바닥에 딱 하나 남은 작은 흰 솜먼지를 가리키며 엄마가 허리에 손을 얹고 미간을 찌푸린 채 주인공에게 잔소리한다. 엄마 다리 옆에 딱 붙어 앉은 쿠퍼는 세상 억울하고 순진한 눈빛으로 간식을 냠냠 씹어 먹고, 주인공은 뾰로통하게 곁눈질하며 억울해한다.",
    englishLine:
      "Mom blames me again! I feel hurt, Cooper—your little act made my whole day crazy.",
    subtitles:
      "Mom blames me again! I feel hurt, Cooper—\nyour little act made my whole day crazy.",
    koreanSubtitle:
      "엄마가 또 내 탓만 하잖아! 나 섭섭해, 쿠퍼—네 그 연기 때문에 오늘 하루가 완전 난리 났다고.",
    usedExpressions: ["feel hurt", "made my whole day"],
    sourceMovies: ["Minari", "Inside Out 2"],
    imageUrl: BEAT_IMAGES[3],
  },
];
