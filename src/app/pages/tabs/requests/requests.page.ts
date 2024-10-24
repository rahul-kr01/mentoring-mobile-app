import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileService } from 'src/app/core/services/profile/profile.service';
import { CommonRoutes } from 'src/global.routes';

@Component({
  selector: 'app-requests',
  templateUrl: './requests.page.html',
  styleUrls: ['./requests.page.scss'],
})
export class RequestsPage implements OnInit {

  public headerConfig: any = {
    menu: true,
    label: 'REQUESTS',
    headerColor: 'primary',
    notification: false,
  };
  segmentType = 'slot-requests';
  buttonConfig = [
    {
      label:'VIEW_MESSAGE',
      action:'viewMessage',
      color:'primary',
    }]
  data: any;

  constructor(private router: Router,
    private profileSevice: ProfileService
  ) { }

  ngOnInit() { 
    this.pendingRequest();
   }

  segmentChanged(event){
    this.segmentType = event.target.value;
  }

  async pendingRequest(){
    let data = await this.profileSevice.pendingRequests();
    this.data = data ? data.result.data : '';
  }

}
