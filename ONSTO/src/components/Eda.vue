<template>
  <div>
      <!-- 標題列 -->
      <div
        class="button is-ghost has-text-grey-lighter"
        :class="{ 'has-text-weight-semibold': !node.isFile }"
        :style="{ paddingLeft: (level * 1.5) + 'rem' }"
        @click="toggle"
      >
        <span v-if="!node.isFile">
          <!-- <span class="icon">
            <i :class="open ? 'fa-solid fa-folder-open' : 'fa-solid fa-folder'"></i>
          </span> -->
          {{ node.name }}
        </span>
        <span v-else>
          <!-- <span class="icon">
            <i class="fas fa-file"></i>
          </span> -->
          {{ node.name }}
        </span>
      </div>

      <!-- 子節點 -->
      <div v-if="!node.isFile && open">
        <file-node
          v-for="child in node.children"
          :key="node.name + '-' + child.name + '-' + level"
          :node="child"
          :level="level + 1"
        />
      </div>
    </div>
</template>
<script>
  import { Methods } from '@/Methods';
  export default{
    name: 'file-node',
    props: {
      node: { type: Object, required: true },
      level: { type: Number, default: 0 },
    },
    data(){
      return{
        isActive:false,
        open: !this.node.isFile && this.level === 1,
      }
    },
    methods:{
      toggle() {
        if (!this.node.isFile) {
          this.open = !this.open;
          Methods.setActiveFolder(this.node);
        }
        else{
          Methods.setActiveFile(this.node);
        }
      },

    }
  }
</script>
<style scoped>

</style>