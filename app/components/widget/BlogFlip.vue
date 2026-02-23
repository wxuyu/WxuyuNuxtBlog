<template>
<BlogWidget card title="翻转查看" right-type="desc" desc="查看最新交流群">
<div class="QQ">
  <div class="flip">
    <div class="wc-card face front">
      <NuxtImg src="/image/DefineAssets/Widget/Flip_QQ/Side_Front.svg" class="cardImage"/>
    </div>
    <div class="wc-card face back">
      <NuxtImg src="/image/DefineAssets/Widget/Flip_QQ/Side_Back.svg" class="cardImage"/>
    </div>
  </div>
</div>
</BlogWidget>
</template>

<style lang="scss" scoped>
:deep(.widget-body) {
  padding: 0!important;
}
.QQ {
  perspective: 800px;
  // background-color: #008000b3;
  justify-content: center;
  height: 100%;
  display: flex;
  container-type: inline-size;
}
.cardImage {
  width: 100%;
}
.flip {
  width: 80%;
  height: 100px;
  transform-style: preserve-3d;
  transition: transform .8s;
  position: relative;
  &:hover {
    -webkit-transform: rotateY(180deg);
    transform: rotateY(180deg);
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }
  .face {
    backface-visibility: hidden;
    justify-content: center;
    width: 100%;
    height: 100%;
    display: flex;
    position: absolute;
    .cardImage {
      width: 100%
    }
  }
  .back {
    transform: rotateY(180deg);
    -webkit-transform: rotateY(180deg);
  }
}
.front, .back {
  display: flex;
  justify-content: center;
  flex-wrap: nowrap;
  position: absolute;
  height: 100%;
  width: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
#card-tuijian#card-tuijian#card-tuijian#card-tuijian {
  height: 100px;
  padding: 0 0.8rem;
  -moz-user-select: none;
  -khtml-user-select: none;
  user-select: none;
}
</style>