import { Component, OnInit } from '@angular/core';
import { urlConstants } from 'src/app/core/constants/urlConstants';
import { HttpService } from 'src/app/core/services';
import { CHAT_MESSAGES } from 'src/app/core/constants/chatConstants'
import { Router } from '@angular/router';
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
  buttonConfig = CHAT_MESSAGES.GENERIC_CARD_REQUEST_BTN_CONFIG;
  data: any;

  constructor(
    private httpService: HttpService,
    private router : Router
  ) { }

  ngOnInit() { 
    this.pendingRequest();
   }

  segmentChanged(event){
    this.segmentType = event.target.value;
  }

  async pendingRequest(){
    const config = {
      url: urlConstants.API_URLS.CONNECTION_REQUEST
    };
    try {
      let data: any = await this.httpService.get(config);
      this.data = data ? data.result.data : '';
      return data;
    }
    catch (error) {
      return error
    }
  }

  onCardClick(event){
    switch (event.type) {
      case 'viewMessage':
        this.router.navigate([CommonRoutes.CHAT, event.data]);
        break;
    }
  }
}
