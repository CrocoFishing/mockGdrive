<template>
  <div class="cell FM is-clipped">
    <div class="box is-clickable mybox" @dblclick="toggle2" @click="toggle3">
      
        <div class="level-item">
          <span v-if="!node.isFile" class="icon is-unselectable">📁</span>
          <span v-else class="icon is-unselectable">📄</span>
          
        </div>
      
      <div class="level-right">
        <div class="level-item">
          
        </div>
      </div>
    </div>
    <div class="field is-grouped">
    <div class="button is-ghost has-text-grey-lighter is-clipped filetitle" @dblclick="toggleRename" @click="toggle3">
      
      <div class="filetitle is-clipped" v-if="!renameState" style="margin-left:0rem">{{ node.name }}</div>
      <div v-else>
        <input v-model="newName" class="input" type="text" @keyup.enter="renameItem" />
      </div>
  </div>
  <span class="control is-pulled-right">
    <button v-if="!renameState" class="button is-ghost is-small has-text-danger DB" @click="remove">Delete</button></span></div>
  </div>
  
</template>
<script>
  import { Methods } from '@/Methods';
  export default{
    data(){
      return{
        renameState:false,
        newName:'',
      }
    },
    props: {
      node: { type: Object, required: true }
    },
    emits: ['refresh'],
    methods:{
      toggleRename(){
        this.renameState = true;
        this.newName = this.node.name;
      },
      async remove(){
        const confirmed = confirm(`Delete "${this.node.name}"?`);
        if(!confirmed) return;
        const ok = await Methods.deletePath(this.node.path, this.node.name);
        if(!ok) {
          alert('Delete failed');
          return;
        }
        this.$emit('refresh');
      },
      async renameItem(){
        const newName = this.newName;
        if(!newName || newName === this.node.name) return;
        const ok = await Methods.rename(this.node.path, this.node.name, newName);
        if(!ok) {
          alert('Rename failed');
          return;
        }
        this.renameState = false;
        this.newName = '';
        this.$emit('refresh');
      },
      handleGlobalEnter(event) {
        if (event.key === 'Escape') {
          console.log("Esc pressed");
          this.renameState = false;
        }
      },
      toggle() {
        if (!this.node.isFile) {
          this.open = !this.open;
          Methods.setActiveFolder(this.node);
        }
        else{
          Methods.setActiveFile(this.node);
        }
      },
      async toggle2() {
        if (!this.node.isFile) {
          this.open = !this.open;
          Methods.setActiveFolder(this.node);
        }
        else{
          Methods.setActiveFile(this.node);
          await Methods.downloadActiveFile();
        }
      },
      toggle3(){
        if (!this.node.isFile) {
          // this.open = !this.open;
          // Methods.setActiveFolder(this.node);
        }
        else{
          Methods.setActiveFile(this.node);
        }
      }
    },
    mounted() {
      document.addEventListener('keyup', this.handleGlobalEnter);
      
    },
    beforeUnmount() {
      document.removeEventListener('keyup', this.handleGlobalKeyup);
    },
  }
</script>
<style scoped>
  .cell FM{
    overflow-y: hidden;
	  overflow-x: hidden;
    text-overflow: ellipsis;
  }
  .filetitle{
    padding: 0px;
    margin: 0px;
    overflow: hidden;
    overflow-y: hidden;
	  overflow-x: hidden;
  }
  .mybox{
    background-color: hsla(256deg, 100%, 86%, 0.1);
    transition: background-color 0.3s ease;
  }
  .mybox:hover {
  background-color: hsla(256deg, 100%, 86%, 0.2);
  }
  .mybox:active {
  background-color: hsla(256deg, 100%, 86%, 0);
  }
  .DB{
    padding-right: 0;
    padding-left: 0;
  }
</style>