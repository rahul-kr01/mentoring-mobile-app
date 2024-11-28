import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { BIG_NUMBER_DASHBOARD_FORM, CREATE_SESSION_FORM, MANAGERS_CREATE_SESSION_FORM } from 'src/app/core/constants/formConstant';
import { localKeys } from 'src/app/core/constants/localStorage.keys';
import { manageSessionAction, permissions } from 'src/app/core/constants/permissionsConstant';
import { LocalStorageService } from 'src/app/core/services';
import { FormService } from 'src/app/core/services/form/form.service';
import { PermissionService } from 'src/app/core/services/permission/permission.service';
import { ProfileService } from 'src/app/core/services/profile/profile.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.page.html',
  styleUrls: ['dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  selectedDuration = 'month';
  startDate: Date | null = null;
  endDate: Date | null = null;
  entityList: any;
  user: any = ['mentee', 'mentor', 'session_manager', 'org_admin'];
  extractedData: any;
  sessions = ['All', 'Private', 'Public'];
  selectedSessionType = 'All';
  selectedEntityType = 'Select entity';
  durationConfig: any = {
    durations:[
      {
        label: 'Week',
        value: 'week'
      },
      {
        label: 'Month',
        value: 'month'
      },
      {
        label: 'Quarter',
        value: 'quarter'
      },
    ]
  }
  filteredCards: any[] = [];
  bigNumbersConfig: any;


  constructor(private permissionService: PermissionService,
    private form: FormService,
    private localStorage: LocalStorageService,
    private profileService: ProfileService
  ) {}

  async ngOnInit() {
    let formConfig =(await this.permissionService.hasPermission({ module: permissions.MANAGE_SESSION, action: manageSessionAction.SESSION_ACTIONS })) ? MANAGERS_CREATE_SESSION_FORM : CREATE_SESSION_FORM;
    const result = await this.form.getForm(formConfig);
    const formData = _.get(result, 'data.fields');
    const entityNames = await this.form.getEntityNames(formData);
    this.entityList = await this.form.getEntities(entityNames, 'SESSION');
    this.extractedData = this.entityList.map(item => ({
        label: item.label,
        value: item.value
    }));
    const response = await this.localStorage.getLocalData(localKeys.USER_DETAILS);
    if(response){
      this.user = await this.profileService.getUserRole(response);
    }

    // big number form

    let bigNumberFormConfig = BIG_NUMBER_DASHBOARD_FORM;
    const bigNUmberresult = await this.form.getForm(bigNumberFormConfig);
    this.bigNumbersConfig = _.get(bigNUmberresult, 'data.fields');
    this.filteredCards = !this.filteredCards.length ? this.bigNumbersConfig[this.user[0]] : [];
  }

  public headerConfig: any = {
    menu: true,
    label: 'DASHBOARD_PAGE',
    headerColor: 'primary',
  };
  
  
downloadData() {
  console.log('Download initiated');
}

selectRoles(){
  console.log('select roles')
}




calculateDates(): void {
  const today = new Date();

  const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
  const lastDayOfYear = new Date(today.getFullYear(), 11, 31);

  switch (this.selectedDuration) {
    case 'week':
      const dayOfWeek = today.getDay();
      this.startDate = new Date(today);
      this.startDate.setDate(today.getDate() - dayOfWeek);
      this.endDate = new Date(today);
      this.endDate.setDate(today.getDate() + (6 - dayOfWeek));
      break;
    case 'month':
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      this.startDate = firstDayOfMonth;
      this.endDate = lastDayOfMonth;
      break;
    case 'quarter':
      const currentQuarter = Math.floor((today.getMonth() + 3) / 3);
      const firstDayOfQuarter = new Date(today.getFullYear(), (currentQuarter - 1) * 3, 1);
      const lastDayOfQuarter = new Date(today.getFullYear(), currentQuarter * 3, 0);
      this.startDate = firstDayOfQuarter;
      this.endDate = lastDayOfQuarter;
      break;
    case 'year':
      this.startDate = firstDayOfYear;
      this.endDate = lastDayOfYear;
      break;
    default:
      this.startDate = null;
      this.endDate = null;
  }
  console.log(this.startDate, this.endDate,"start and end");
}

handleRoleChange(e) {
  const selectedRole = e.detail.value;
  this.filteredCards = this.bigNumbersConfig[selectedRole] || [];
}
handleSessionTypeChange(event){

}
handleEntityChange(event){

}

}
