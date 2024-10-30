import { Component } from '@angular/core';
import { IonTabs } from '@ionic/angular';
import { localKeys } from 'src/app/core/constants/localStorage.keys';
import { PAGE_IDS } from 'src/app/core/constants/page.ids';
import { LocalStorageService } from 'src/app/core/services';
import { ProfileService } from 'src/app/core/services/profile/profile.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage {
  private activeTab?: HTMLElement;
  subscription: any;
  PAGE_IDS = PAGE_IDS
  constructor(
    private localStorage : LocalStorageService,
    private profile: ProfileService,

  ) {}
  tabChange(tabsRef: IonTabs) {
    this.activeTab = tabsRef?.outlet?.activatedView?.element;
  }
  ionViewWillLeave() {
    this.localStorage.getLocalData(localKeys.USER_DETAILS).then((userDetails)=>{
      if(userDetails) {
        this.profile.getUserRole(userDetails)
       }
    })
    this.propagateToActiveTab('ionViewWillLeave');
  }

  ionViewDidLeave() {
    this.propagateToActiveTab('ionViewDidLeave');
  }

  ionViewWillEnter() {
    this.propagateToActiveTab('ionViewWillEnter');
  }

  ionViewDidEnter() {
    this.propagateToActiveTab('ionViewDidEnter');
  }
  private propagateToActiveTab(eventName: string) {
    if (this.activeTab) {
      this.activeTab.dispatchEvent(new CustomEvent(eventName));
    }
  }
  allowTemplateView(page) {
    return !environment.restictedPages.includes(page);
  }
}
