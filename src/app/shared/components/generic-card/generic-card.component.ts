import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { localKeys } from 'src/app/core/constants/localStorage.keys';
import { LocalStorageService } from 'src/app/core/services';
import { CommonRoutes } from 'src/global.routes';

@Component({
  selector: 'app-generic-card',
  templateUrl: './generic-card.component.html',
  styleUrls: ['./generic-card.component.scss'],
})
export class GenericCardComponent implements OnInit {
  @Input() data: any;
  @Output() onClickEvent = new EventEmitter();
  @Input() buttonConfig: any;
  @Input() meta: any;

  constructor(private localStorage: LocalStorageService, private router: Router) { }

  async ngOnInit() { 
    // let user = await this.localStorage.getLocalData(localKeys.USER_DETAILS);
   }

  onCardClick(data) {
    this.router.navigate([CommonRoutes.MENTOR_DETAILS, (data?.id || data?.user_id)]);
  }
  handleButtonClick(action: string, id) {
    let value = {
      data: id,
      type: action,
    }
    this.onClickEvent.emit(value);
  }
}
