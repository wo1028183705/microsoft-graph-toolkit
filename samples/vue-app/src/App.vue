<template>
  <div id="app">
    <mgt-mock-provider></mgt-mock-provider>

    <mgt-login @loginCompleted="loggedIn"></mgt-login>

    <LoggedInPage v-if="signedIn"/>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import LoggedInPage from './components/LoggedInPage.vue';

/* Importing the MGT will initialize all the providers and components for us. TODO: fix #58*/
import 'microsoft-graph-toolkit/dist/es6/mock/mgt-mock-provider.js';
import 'microsoft-graph-toolkit/dist/es6/components/mgt-login/mgt-login.js';
import 'microsoft-graph-toolkit/dist/es6/components/mgt-agenda/mgt-agenda.js';
// import 'microsoft-graph-toolkit/dist/es6/Providers.js';
// import 'microsoft-graph-toolkit/dist/es6/providers/IProvider.js';
// declare var Providers: any;
// declare var ProviderState: any;

@Component({
  components: {
    LoggedInPage,
  },
})
export default class App extends Vue {
  private signedIn = false;

  private loggedIn() {
    this.signedIn = true;
  }

  private mounted() {
    // Providers.onProviderUpdated(() => {
    //   this.checkLoggedIn();
    // });
    // this.checkLoggedIn();
  }

  // private checkLoggedIn() {
  //   if (Providers.globalProvider && Providers.globalProvider.state === ProviderState.SignedIn) {
  //     this.signedIn = true;
  //   }
  // }
}
</script>

<style lang="scss">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
