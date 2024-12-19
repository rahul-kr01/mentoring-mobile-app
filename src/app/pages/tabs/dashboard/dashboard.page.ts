import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { BIG_NUMBER_DASHBOARD_FORM, CREATE_SESSION_FORM, MANAGERS_CREATE_SESSION_FORM } from 'src/app/core/constants/formConstant';
import { localKeys } from 'src/app/core/constants/localStorage.keys';
import { manageSessionAction, permissions } from 'src/app/core/constants/permissionsConstant';
import { LocalStorageService } from 'src/app/core/services';
import { FormService } from 'src/app/core/services/form/form.service';
import { PermissionService } from 'src/app/core/services/permission/permission.service';
import { ProfileService } from 'src/app/core/services/profile/profile.service';
import * as moment from 'moment';

@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.page.html',
  styleUrls: ['dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  selectedDuration = 'month';
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
  startDate: moment.Moment;
  endDate: moment.Moment;

  /////
  apiResponse = [
    {
      "from": "1-1-2023",
      "to": "31-1-2023",
      "createdSession": 15,
      "conductedSession": 10
    },
    {
      "from": "1-2-2023",
      "to": "28-2-2023",
      "createdSession": 25,
      "conductedSession": 15
    },
    {
      "from": "1-3-2023",
      "to": "31-3-2023",
      "createdSession": 15,
      "conductedSession": 10
    }
  ];
  data: any;

/// new changes
  currentFormControls: any[] = [];
  selectedValues: { [key: string]: any } = {};

  constructor(private permissionService: PermissionService,
    private form: FormService,
    private localStorage: LocalStorageService,
    private profileService: ProfileService
  ) {}

  async ngOnInit() {
    this.data = this.transformApiResponse(this.apiResponse);
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
    const bigNumberResult = await this.form.getForm(bigNumberFormConfig);
    this.bigNumbersConfig = _.get(bigNumberResult, 'data.fields');
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



calculateDates(event): void {
  const today = moment();
  this.selectedDuration = event.detail.value;

  // Calculate the first and last days of the year
  const firstDayOfYear = moment().startOf('year');
  const lastDayOfYear = moment().endOf('year');

  switch (this.selectedDuration) {
    case 'week':
      // Start of the week (Sunday) and end of the week (Saturday)
      this.startDate = today.clone().startOf('week');
      this.endDate = today.clone().endOf('week');
      break;
    case 'month':
      // Start and end of the current month
      this.startDate = today.clone().startOf('month');
      this.endDate = today.clone().endOf('month');
      break;
    case 'quarter':
      // Start and end of the current quarter
      this.startDate = today.clone().startOf('quarter');
      this.endDate = today.clone().endOf('quarter');
      break;
    case 'year':
      // Start and end of the current year
      this.startDate = firstDayOfYear.clone();
      this.endDate = lastDayOfYear.clone();
      break;
    default:
      this.startDate = null;
      this.endDate = null;
  }

  // Format the dates for display
  const formattedStartDate = this.startDate ? this.startDate.format('DD/MM/YYYY HH:mm [IST]') : null;
  const formattedEndDate = this.endDate ? this.endDate.format('DD/MM/YYYY HH:mm [IST]') : null;

  // Convert to epoch time (milliseconds)
  const startDateEpoch = this.startDate ? this.startDate.valueOf() : null;
  const endDateEpoch = this.endDate ? this.endDate.valueOf() : null;

  console.log('Start Date:', formattedStartDate,startDateEpoch);
  console.log('End Date:', formattedEndDate,endDateEpoch);
}

handleRoleChange(e) {
  const selectedRole = e.detail.value;
  this.filteredCards = this.bigNumbersConfig[selectedRole] || [];
}
handleSessionTypeChange(event){

}
handleEntityChange(event){

}

transformApiResponse(response: any[]): any {
  const labels: string[] = [];
  const createdSessionData: number[] = [];
  const conductedSessionData: number[] = [];


  response.forEach(item => {
    const monthName = moment(item.from, "D-M-YYYY").format("MMMM");
    labels.push(monthName);

    createdSessionData.push(item.createdSession);
    conductedSessionData.push(item.conductedSession);
  });

  return {
    labels,
    datasets: [
      {
        label: "Created Sessions",
        data: createdSessionData,
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1
      },
      {
        label: "Conducted Sessions",
        data: conductedSessionData,
        backgroundColor: "rgba(255, 159, 64, 0.6)",
        borderColor: "rgba(255, 159, 64, 1)",
        borderWidth: 1
      }
    ]
  };
}


}
