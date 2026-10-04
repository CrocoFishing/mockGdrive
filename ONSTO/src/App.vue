
<template>
<LoginPage v-if="!isLogin"
  @loginSucess="isLogin=true" />
<MainPage v-else
  @logOut="isLogin=false" />
</template>
<script>
import LoginPage from './components/LoginPage.vue';
import MainPage from './components/MainPage.vue';
import { Methods } from './Methods';
  export default{
    data(){
      return{
        isLogin:false,
      }
    },
    components:{
      LoginPage,MainPage,
    },
    async mounted(){
      const ok = await Methods.tryAutoLogin();
      if(ok) this.isLogin = true;
    },
    methods:{
      handleLogout(){
        Methods.logout();
        this.isLogin = false;
      }
    }
  }
</script>
<style>
/* body{
  font-family: 'Courier New','Courier New','Courier New','Courier New';
  background:
    linear-gradient(rgba(0, 0, 0, 0.7), rgba(66, 66, 66, 0.3)),
    url("../src/assets/main_BG.svg"),
    hsl(256, 80%, 86%);
  background-size:cover cover;
} */
html, body, #app {
  min-height: 100vh;
}

body {
  background: 
    linear-gradient(rgba(0, 0, 0, 0.7), rgba(66, 66, 66, 0.3)),
    url("../src/assets/main_BG.svg") center/cover no-repeat,
    hsl(256, 80%, 86%);
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}
:root {
  --bulma-primary-h: 256deg;
  --bulma-primary-l: 86%;
}
</style>
<style scoped>

</style>
