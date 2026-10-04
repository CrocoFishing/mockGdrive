
const express = require('express');
const path = require('path');
const cors=require('cors');
const fs = require('fs/promises');
const multer = require('multer');
// const { writeFile } = require('fs');
// const { console } = require('inspector');

// ensure temp upload dir exists for multer
const TMP_UPLOAD_DIR = path.join(__dirname,'data', 'tmp_uploads');
fs.mkdir(TMP_UPLOAD_DIR, { recursive: true }).catch(()=>{});
const upload = multer({ dest: TMP_UPLOAD_DIR });

const app = express();
app.use(express.json());
app.use(cors());
const PORT=5487;

const USERS_PATH=path.join(__dirname,'data','users.json')
let users=[]
async function loadData(){
    try{
        const raw = await fs.readFile(USERS_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        users=parsed||[];
    }catch(error){
        if(error.code==='ENOENT'){
            users=[];
            await usersOverride();
        }else{throw error;}
    }
};
async function usersOverride(){
    await fs.mkdir(path.dirname(USERS_PATH),{recursive:true});
    const payload = JSON.stringify(users, null, 2);
    await fs.writeFile(USERS_PATH, payload, 'utf-8');
};
async function Mkdir(newid){
    const new_storage_path=path.join(__dirname,'data','storage',newid);
    try{
        await fs.mkdir(new_storage_path);
    }catch(error){
        await fs.rm(new_storage_path, { recursive: true, force: true });
        await fs.mkdir(new_storage_path);
    }
};
app.get('/api/loginPage',async(req,res)=>{
    await usersOverride();
    res.json(users);
})
const findUser=(newid)=>{
    return users.find((user)=>user.id===newid);
};
app.post('/api/signup',async(req,res)=>{
    const {newid,passwd}=req.body;
    if(findUser(newid)){
        return res.status(409).json({message:'user exist'});
    }
    else{
        users.push({
            "id":newid,
            "passwd":passwd
        });
        Mkdir(newid);
        await usersOverride();
        res.status(201).json({message:'signup success'})
    }
});
const authenticate = (loginId, loginPw) => {
    const user = findUser(loginId);
    if (!user) return false;
    return user.passwd === loginPw;
}
async function readUserDirectoryToJson(directoryPath) {
    const items = [];
    async function walk(dirPath, relPath = []) {
        let dirents;
        try {
            dirents = await fs.readdir(dirPath, { withFileTypes: true });
        } catch (err) {
            if (err && err.code === 'ENOENT') return; // no directory, return empty
            throw err;
        }
        for (const dirent of dirents) {
            if (dirent.isFile()) {
                items.push({ name: dirent.name, path: relPath.slice(), isFile: true });
            } else if (dirent.isDirectory()) {
                items.push({ name: dirent.name, path: relPath.slice(), isFile: false });
                await walk(path.join(dirPath, dirent.name), [...relPath, dirent.name]);
            }
        }
    }
    await walk(directoryPath, []);
    return items;
}
app.post('/api/login',async(req,res)=>{
    const {loginId,loginPw,wantTree}=req.body;
    if(authenticate(loginId,loginPw)){
        if(wantTree){
            const storage_path=path.join(__dirname,'data','storage',loginId);
            const dirStruct=await readUserDirectoryToJson(storage_path);
            res.status(200).json(dirStruct);
        }
        else{
            res.status(200).json({msg:"loginSucess"});
        }
    }
    else{
        res.status(400).json({message:"login failed"});
    }
});

// Create directory inside user's storage. body: {loginId, loginPw, path: [..], name}
app.post('/api/file/mkdir', async (req, res) => {
    const { loginId, loginPw, path: relPath = [], name } = req.body;
    if (!authenticate(loginId, loginPw)) return res.status(403).json({ message: 'auth failed' });
    try {
        const base = path.join(__dirname, 'data', 'storage', loginId);
        const fullPath = path.join(base, ...relPath, name);
        await fs.mkdir(fullPath, { recursive: true });
        return res.status(201).json({ message: 'mkdir success' });
    } catch (err) {
        console.error('mkdir error', err);
        return res.status(500).json({ message: 'mkdir failed' });
    }
});

// Delete file or directory. body: {loginId, loginPw, path: [..], name, isFile}
app.post('/api/file/delete', async (req, res) => {
    const { loginId, loginPw, path: relPath = [], name } = req.body;
    if (!authenticate(loginId, loginPw)) return res.status(403).json({ message: 'auth failed' });
    try {
        const base = path.join(__dirname, 'data', 'storage', loginId);
        const target = path.join(base, ...relPath, name);
        await fs.rm(target, { recursive: true, force: true });
        return res.status(200).json({ message: 'delete success' });
    } catch (err) {
        console.error('delete error', err);
        return res.status(500).json({ message: 'delete failed' });
    }
});

// Rename file or directory. body: {loginId, loginPw, path: [..], oldName, newName}
app.post('/api/file/rename', async (req, res) => {
    const { loginId, loginPw, path: relPath = [], oldName, newName } = req.body;
    if (!authenticate(loginId, loginPw)) return res.status(403).json({ message: 'auth failed' });
    try {
        const base = path.join(__dirname, 'data', 'storage', loginId);
        const src = path.join(base, ...relPath, oldName);
        const dst = path.join(base, ...relPath, newName);
        await fs.rename(src, dst);
        return res.status(200).json({ message: 'rename success' });
    } catch (err) {
        console.error('rename error', err);
        return res.status(500).json({ message: 'rename failed' });
    }
});

// Upload files. multipart/form-data with fields: loginId, loginPw, path (JSON array), files[]
app.post('/api/file/upload', upload.array('files'), async (req, res) => {
    const { loginId, loginPw, path: relPathRaw = '[]' } = req.body;
    if (!authenticate(loginId, loginPw)) return res.status(403).json({ message: 'auth failed' });
    let relPath = [];
    try{
        relPath = JSON.parse(relPathRaw);
        if(!Array.isArray(relPath)) relPath = [];
    }catch(e){ relPath = []; }

    try {
        const base = path.join(__dirname, 'data', 'storage', loginId);
        // ensure target dir exists
        const targetDir = path.join(base, ...relPath);
        await fs.mkdir(targetDir, { recursive: true });
        // move uploaded files into target dir
        for(const f of req.files){
            const src = f.path; // temp path
            const dst = path.join(targetDir, f.originalname);
            await fs.rename(src, dst);
        }
        return res.status(201).json({ message: 'upload success' });
    } catch (err) {
        console.error('upload error', err);
        return res.status(500).json({ message: 'upload failed' });
    }
});

// Download a single file: query params loginId, loginPw, path (JSON array), name
app.get('/api/file/download', async (req, res) => {
    const { loginId, loginPw, path: relPathRaw = '[]', name } = req.query;
    if (!authenticate(loginId, loginPw)) return res.status(403).json({ message: 'auth failed' });
    let relPath = [];
    try{ relPath = JSON.parse(relPathRaw); if(!Array.isArray(relPath)) relPath=[]; }catch(e){ relPath = []; }
    try{
        const base = path.join(__dirname, 'data', 'storage', loginId);
        const target = path.join(base, ...relPath, name);
        // stream file as attachment
        return res.download(target, name);
    }catch(err){
        console.error('download error', err);
        return res.status(500).json({ message: 'download failed' });
    }
});
loadData()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on port:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to load initial data:', err);
    process.exit(1);
  });