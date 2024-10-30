import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { CHAT_MESSAGES } from 'src/app/core/constants/chatConstants';
import { urlConstants } from 'src/app/core/constants/urlConstants';
import { HttpService, ToastService } from 'src/app/core/services';

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.page.html',
  styleUrls: ['./chat-window.page.scss'],
})
export class ChatWindowPage implements OnInit {
  public headerConfig: any = {
    menu: false,
    headerColor: 'primary',
  };
  id;
  messageLimit = CHAT_MESSAGES.MESSAGE_TEXT_LIMIT;

  message : string = "Hi, I would like to connect with you.";
  info :any ={};
  messages ={};
  constructor(
    private httpService : HttpService,
    private routerParams : ActivatedRoute,
    private toast : ToastService,
    private alert : AlertController,
    private translate : TranslateService
  ) { 
    routerParams.params.subscribe(parameters =>{
      this.id = parameters?.id;
    })
  }

  ngOnInit() {
    this.getConnectionInfo();
  }

  getConnectionInfo () {
    const payload ={
      url : urlConstants.API_URLS.GET_CHAT_INFO,
      payload:{
        user_id : this.id
      }
    }
    this.httpService.post(payload).then(resp =>{
      this.info = resp?.result;
      if(resp?.result?.status == 'REQUESTED'){
        this.message = '';
      }
      this.info.status = !resp?.result?.status ?  'PENDING' : resp?.result?.status;
      if(this.info.created_by === this.info.user_id){
        this.messages= CHAT_MESSAGES.INITIATOR
      }else{
        this.messages= CHAT_MESSAGES.RECEIVER;
      }
    })
  }
  sendRequest(){
    if(this.info.status == 'REQUESTED'){
      this.toast.showToast('MULTIPLE_MESSAGE_REQ','danger')
      return;
    }
    const payload ={
      url : urlConstants.API_URLS.SEND_REQUEST,
      payload:{
        user_id : this.id, 
        message : this.message
      }
    }
    this.httpService.post(payload).then(resp =>{
      this.info.status = "REQUESTED"
      this.getConnectionInfo();
    })
  }
  acceptRequest(){
    const payload ={
      url : urlConstants.API_URLS.ACCEPT_MSG_REQ,
      payload:{
        user_id : this.id
      }
    }
    this.httpService.post(payload).then(resp =>{
      this.info.status = "ACCEPTED"
    })
  }

  async rejectConfirmation(){
    let texts: any;
        this.translate
          .get(['MESSAGE_REQ_REJECT', 'REJECT','CANCEL'])
          .subscribe((text) => {
            texts = text;
          });
    const alert = await this.alert.create({
      header: texts['REJECT'] +'?',
      message: texts['MESSAGE_REQ_REJECT'],
      buttons: [
        {
          text: texts['REJECT'] ,
          role:'cancel',
          handler: () => {
           this.rejectRequest();
          }
        },
        {
          text: texts['CANCEL'] ,
          handler: () => {
          }
        },
       
      ]
    });

    await alert.present();
  }
  rejectRequest(){
    const payload ={
      url : urlConstants.API_URLS.REJECT_MSG_REQ,
      payload:{
        user_id : this.id
      }
    }
    this.httpService.post(payload).then(resp =>{
      this.info.status = 'REJECTED';
      this.messages = CHAT_MESSAGES.RECEIVER;
      this.toast.showToast('REJECTED_MESSAGE_REQ','danger')
    })
  }
}