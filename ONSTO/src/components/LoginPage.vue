<template>
	<section
  class="section is-flex is-justify-content-center is-align-items-center"
  style="min-height: 100vh;">
  <form class="box" @submit.prevent="attempt(id, passwd)">
    <div class="field">
    <div class="control">
      <input class="input is-unselectable" type="text" placeholder="ID" v-model="id" />
    </div>
  </div>
  <div class="field">
    <div class="control">
      <input class="input is-unselectable" type="password" placeholder="••••••" v-model="passwd" />
    </div>
  </div>
  <button type="submit" class="button is-white is-radiusless">
		Login</button>
	<p></p>
	<button type="button" class="button is-white is-radiusless" @click="signUp(id, passwd)">
		Sign up</button>
	<div v-if="loginFailed" class="has-text-danger is-pulled-right">Login Failed</div>
	<div v-else-if="!signupSuccess&&signupFailed" class="has-text-danger is-pulled-right">Signup Failed</div>
	</form>
	</section>
</template>
<script>
import {Methods} from '../Methods'
export default{
	data(){
		return{
			loginFailed:false,
			signupFailed:false,
			signupSuccess:false,
			id:'',
			passwd:'',
			fileTree:[],
		}
	},
	emits:['loginSucess'],
	methods:{
		async attempt(id, passwd){
			this.signupSuccess=false;
			this.signupFailed=false;
			const success = await Methods.attemptLogin(id, passwd);
			if (success){
				this.$emit('loginSucess');
				this.loginFailed = false;
			} else {
				this.id = '';
				this.passwd = '';
				this.loginFailed = true;
				this.signupFailed=false;
			}
		},
		async signUp(id, passwd){
			this.loginFailed = false;
			this.signupFailed = false;
			this.signupSuccess = false;
			const success = await Methods.signUp(id, passwd);
			if (success){
				this.signupFailed = false;
				this.signupSuccess = true;
				// Auto-login after signup
				const loginOk = await Methods.attemptLogin(id, passwd);
				if (loginOk){
					this.loginFailed = false;
					this.$emit('loginSucess');
				} else {
					console.error('signup succeeded but auto-login failed');
					this.loginFailed = true;
					this.id = '';
					this.passwd = '';
				}
			} else {
				this.id = '';
				this.passwd = '';
				this.signupFailed = true;
				this.signupSuccess = false;
			}
		}
	},
	async update(){
			try{
				await signUp(Methods.state.savedID,Methods.state.savedPW);
			}catch(err){
				console.error("Prelogin failed");
			}
		},
}
</script>
<style scoped>
.button{
	--bulma-button-padding-vertical:0.1em;
	--bulma-button-padding-horizontal:0.5em;
}
.box{
	--bulma-box-radius:3px;
}
.input{
	--bulma-input-radius:3px;
}
</style>