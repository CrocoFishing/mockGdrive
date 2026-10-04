//import { Promise } from 'core-js';
import { reactive } from 'vue';
import axios from 'axios';
const API_PREFIX='/api';


// function recursiveCompare(l1,l2){
//     if(l1.path.length==0)var k1=l1.name;
//     else var k1=l1.path[0];
//     if(l2.path.length==0)var k2=l2.name;
//     else var k2=l2.path[0];
//     if(k1==k2){
//         var l1d={...l1};
//         var l2d={...l2};
//         if(l1.path.length!=0)l1d.path.splice(0,1);
//         if(l2.path.length!=0)l2d.path.splice(0,1);
//         if(l1.path.length==0&&l2.path.length==0)return 0;
//         return recursiveCompare(l1d,l2d);
//     }
//     else{
//         return k1.localeCompare(k2);
//     }
// }
export const Methods={
    state:reactive({
        fileTree:[],
        savedID:'',
        savedPW:'',
        activeFile:null,
        activeFolder:null,
    }),
    setActiveFile(fileNode){
        this.state.activeFile = fileNode;
    },
    setActiveFolder(folderNode){
        this.state.activeFolder = folderNode;
    },
    async tryAutoLogin(){
        try{
            const raw = localStorage.getItem('savedCreds');
            if(!raw) return false;
            const { id, pw } = JSON.parse(raw);
            if(!id || !pw) return false;
            const ok = await this.attemptLogin(id, pw);
            if(!ok){
                localStorage.removeItem('savedCreds');
                return false;
            }
            return true;
        }catch(e){
            console.error('auto-login failed', e);
            return false;
        }
    },
    logout(){
        this.state.savedID='';
        this.state.savedPW='';
        this.state.activeFile=null;
        this.state.activeFolder=null;
        try{ localStorage.removeItem('savedCreds'); }catch(e){}
    },
    async attemptLogin(id, passwd){
        console.log("try log in");
        try {
            await axios.post(`${API_PREFIX}/login`, {
                loginId:id,
                loginPw:passwd,
                wantTree:false,
            });
            console.log("login success!");
            this.state.savedID=id;
            this.state.savedPW=passwd;
            try{
              localStorage.setItem('savedCreds', JSON.stringify({ id, pw: passwd }));
            }catch(e){/* ignore if not available */}
            return true;

        } catch (err) {
            console.error(err);
            console.log("returning false")
            return false;
        }
    },

    async fetchFileTree(){
        console.log("try fetch tree");
        try {
            const response = await axios.post(`${API_PREFIX}/login`, {
                loginId:this.state.savedID,
                loginPw:this.state.savedPW,
                wantTree:true,
            });
            this.state.fileTree = response.data;
            console.log(this.state.fileTree);
            return this.state.fileTree;

        } catch (err) {
            console.error(err);
            return [];
        }
    },
    async mkdir(pathArr, name){
        try{
            const resp = await axios.post(`${API_PREFIX}/file/mkdir`, { loginId: this.state.savedID, loginPw: this.state.savedPW, path: pathArr, name });
            if (resp.status === 201){
                await this.fetchFileTree();
                return true;
            }
            return false;
        }catch(err){
            console.error('mkdir failed', err);
            return false;
        }
    },
    async deletePath(pathArr, name){
        try{
            const resp = await axios.post(`${API_PREFIX}/file/delete`, { loginId: this.state.savedID, loginPw: this.state.savedPW, path: pathArr, name });
            if (resp.status === 200){
                await this.fetchFileTree();
                return true;
            }
            return false;
        }catch(err){
            console.error('delete failed', err);
            return false;
        }
    },
    async rename(pathArr, oldName, newName){
        try{
            const resp = await axios.post(`${API_PREFIX}/file/rename`, { loginId: this.state.savedID, loginPw: this.state.savedPW, path: pathArr, oldName, newName });
            if (resp.status === 200){
                await this.fetchFileTree();
                return true;
            }
            return false;
        }catch(err){
            console.error('rename failed', err);
            return false;
        }
    },
    setActiveFile(fileNode){
        this.state.activeFile=fileNode;
    },
    setActiveFolder(fileNode){
        this.state.activeFolder=fileNode;
    },
    async signUp(id, passwd){
        console.log('try sign up');
        try{
            const resp = await axios.post(`${API_PREFIX}/signup`, { newid: id, passwd: passwd });
            console.log('signup response', resp.status);
            if (resp.status === 201){
                this.state.savedID = id;
                this.state.savedPW = passwd;
                try{ localStorage.setItem('savedCreds', JSON.stringify({ id, pw: passwd })); }catch(e){}
                return true;
            }
            return false;
        }catch(err){
            console.error(err);
            return false;
        }
    },
    //Copilot
    async downloadActiveFile(){
        const f = this.state.activeFile;
        if(!f || !f.isFile){
            alert('Select a file to download');
            return;
        }
        const params = new URLSearchParams({
            loginId: this.state.savedID,
            loginPw: this.state.savedPW,
            path: JSON.stringify(f.path || []),
            name: f.name,
        });
        const url = `${API_PREFIX}/file/download?${params.toString()}`;
        try{
            const resp = await fetch(url, { method: 'GET' });
            if(!resp.ok){
                const text = await resp.text();
                console.error('download error', resp.status, text);
                alert('Download failed');
                return;
            }
            const blob = await resp.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = f.name;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(blobUrl);
        }catch(err){
            console.error('download failed', err);
            alert('Download failed');
        }
    },
    async uploadToActiveFolder(){
        // create input dynamically so we don't need to add UI element
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.onchange = async () => {
            if(!input.files || input.files.length===0) return;
            const files = Array.from(input.files);
            const af = this.state.activeFolder;
            const targetPath = af ? af.path.concat(af.name) : [];
            const fd = new FormData();
            fd.append('loginId', this.state.savedID);
            fd.append('loginPw', this.state.savedPW);
            fd.append('path', JSON.stringify(targetPath));
            files.forEach((file) => fd.append('files', file, file.name));
            try{
                const resp = await axios.post(`${API_PREFIX}/file/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                if(resp.status === 201){
                    await this.fetchFileTree();
                    alert('Upload successful');
                }else{
                    console.error('upload response', resp.status, resp.data);
                    alert('Upload failed');
                }
            }catch(err){
                console.error('upload failed', err);
                alert('Upload failed');
            }
        };
        // open file picker
        input.click();
    },
}