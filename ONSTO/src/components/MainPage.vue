<template>
	<section class="section">
		
<div class="fixed-grid has-3-cols">
<div class="grid ">
	<div class="box scrollable has-text-grey-lighter">
		<div class="cell">
			<!-- <div v-for="fileData in fileTree"> -->
				<!-- {{ fileData }} -->
				<!-- <Eda :fileData="fileTree" /> -->
				<Eda
        v-for="node in tree"
        :key="node.name"
        :node="node"
        :level="0"
      	/>
			<!-- </div> -->
		</div>
	</div>
	<div class="box scrollable has-text-grey-lighter">
		<div class="cell">
			<div class="field is-grouped">
				<div class="control">
					<button class="button is-ghost has-text-grey-lighter" @click="toParent"><i class="fa-solid fa-chevron-left"></i></button>
				</div>
				<div class="control is-expanded">
					<input class="input is-rounded" v-model="newFolderName" placeholder="New folder name" />
				</div>
				<div class="control">
					<button class="button is-ghost has-text-grey-lighter LB" @click="createFolder">Create Folder</button>
					<button class="button is-ghost has-text-grey-lighter RB" @click="upload">/ Upload</button>
				</div>
			</div>
			<hr class="myline"></hr>
			<div class="grid is-gap-2">
				<FileManip 
				v-for="node in getActiveFolderNode()"
				:key="node.name"
        :node="node"
        @refresh="GetFileTree"
				/>
			</div>
		</div>
	</div>
<div class="box scrollable has-text-grey-lighter">
  <div class="cell mr">
		<div class="field is-grouped">
			<button class="button is-ghost has-text-grey-lighter" @click="download()">Download file</button>
			<div class="control is-expanded">
		<button class="button is-ghost has-text-grey-lighter is-pulled-right" @click="logOut">
			Logout</button></div>
			<!-- <input class="input" placeholder="New folder name" /> -->
		</div>
		<hr class="myline"></hr>
		<span>
			<p>{{activeFileName}}</p>
		</span>
	</div>
</div>
</div>
</div>
</section>
</template>
<script>
	import { Methods } from '@/Methods';
	import { treeBuilder } from '@/assets/treeBuilder';
	import Eda from './Eda.vue';
	import FileManip from './FileManip.vue';
    export default{
        data(){
            return{
							fileTree:[],
							tree: [],
							newFolderName:'',
			            }
        },
    computed:{
      activeFileName(){
        return Methods.state.activeFile ? Methods.state.activeFile.name : '';
      }
    },
    emits:['logOut'],
		components:{Eda, FileManip},
		methods:{
			logOut(){
				this.$emit('logOut');
			},
			async GetFileTree(){
				this.fileTree=await Methods.fetchFileTree();
				// this.fileTree.sort((l1,l2)=>{
				// 	if(l1.path.length===l2.path.length){
				// 		return l1.name.localeCompare(l2.name);
				// 	}
				// 	else{
				// 		return l1.path.length - l2.path.length;
				// 	}
				// });
				this.tree = treeBuilder.buildTree(this.fileTree);
			// set a default active folder if none
			if (!Methods.state.activeFolder && this.tree.length) Methods.setActiveFolder(this.tree[0]);
			// console.log('raw fileTree:', this.fileTree);
			// console.log('built tree:', this.tree);
			},
			async createFolder(){
				if(!this.newFolderName) return;
				const af = Methods.state.activeFolder;
				if(af && af.isFile){
					alert('Cannot create inside a file. Select a folder first.');
					return;
				}
				const targetPath = af ? af.path.concat(af.name) : [];
				const name = this.newFolderName;
				const ok = await Methods.mkdir(targetPath, name);
				if(ok){
					this.newFolderName='';
					// refresh and then select the newly created folder
					await this.GetFileTree();
					// find and set active folder
					function findNode(nodes, pathArr, name){
						for(const n of nodes){
							if(JSON.stringify(n.path)===JSON.stringify(pathArr) && n.name===name) return n;
							if(n.children){
								const r = findNode(n.children, pathArr, name);
								if(r) return r;
							}
						}
						return null;
					}
					const newNode = findNode(this.tree, targetPath, name);
					if(newNode) Methods.setActiveFolder(newNode);
				}
			},
			getActiveFolderNode(){
				const af = Methods.state.activeFolder;
				if(!af) return this.tree;
				return af.children || [];
			},
			async toParent(){
				const af = Methods.state.activeFolder;
				if(!af){
					// already at root
					Methods.setActiveFolder(null);
					return;
				}
				const parentPath = af.path || [];
				// if af is top-level, go to root
				if(parentPath.length === 0){
					Methods.setActiveFolder(null);
					return;
				}
				const parentName = parentPath[parentPath.length - 1];
				const parentPathArr = parentPath.slice(0, -1);
				// helper to search node by path+name
				function findNode(nodes, pathArr, name){
					for(const n of nodes){
						if(JSON.stringify(n.path) === JSON.stringify(pathArr) && n.name === name) return n;
						if(n.children){
							const r = findNode(n.children, pathArr, name);
							if(r) return r;
						}
					}
					return null;
				}
				const parentNode = findNode(this.tree, parentPathArr, parentName);
				Methods.setActiveFolder(parentNode);
				await this.GetFileTree();
			},
			async download(){
				Methods.downloadActiveFile();
			},
			async upload(){
				Methods.uploadToActiveFolder();
			},

		},
		// async updated(){
		// 	await this.GetFileTree();
		// },
		async mounted(){
			await this.GetFileTree();
			// Watch for server-side changes to the file list and rebuild tree automatically
			this.$watch(() => Methods.state.fileTree, (newVal) => {
				this.tree = treeBuilder.buildTree(newVal || []);
				if (!Methods.state.activeFolder && this.tree.length) Methods.setActiveFolder(this.tree[0]);
			}, { deep: true });
		},

};
</script>
<style lang="scss" scoped>
	.scrollable {
	--bulma-box-background-color:hsla(0, 0%, 100%, 5%);
	--bulma-box-radius:3px;
  max-height: 790px;
	min-height: 790px;
  overflow-y: auto;
	overflow-x: auto;
  //@include overflow-touch(); // Bulma 提供的 momentum scroll mixin
}
.cell{
	overflow-x: auto;
}
.grid{
	overflow-x: auto;
}
.mr{
	overflow-x: auto;
}
.section{
	--bulma-section-padding:0 0;
}
.myline{
	border: none;
  height: 1px;
  background-color: #ccc;
  margin: 1em 0;
}
.LB{
	margin-right:0;
	border-right: 0;
	padding-right: 0.5em;
}
.RB{
	margin-left: 0;
	border-left: 0;
	padding-left: 0;
}
</style>