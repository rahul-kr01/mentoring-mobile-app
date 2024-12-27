import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { BIG_NUMBER_DASHBOARD_FORM } from 'src/app/core/constants/formConstant';
import { localKeys } from 'src/app/core/constants/localStorage.keys';
import { HttpService, LocalStorageService } from 'src/app/core/services';
import { FormService } from 'src/app/core/services/form/form.service';
import { PermissionService } from 'src/app/core/services/permission/permission.service';
import { ProfileService } from 'src/app/core/services/profile/profile.service';
import * as moment from 'moment';
import { urlConstants } from 'src/app/core/constants/urlConstants';

@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.page.html',
  styleUrls: ['dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  selectedDuration = 'month';
  user: any;
  sessions: any;
  filteredCards: any[] = [];
  bigNumbersConfig: any;
  startDate: moment.Moment;
  endDate: moment.Moment;
  filterType: any = 'session';

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

  dynamicFormControls: any[] = [];
  filteredFormData: any;
  bigNumberFormData: any;
  result: any;

  constructor(
    private form: FormService,
    private localStorage: LocalStorageService,
    private profileService: ProfileService,
    private httpService: HttpService
  ) { }

  async ngOnInit() {
    this.result = await this.dashboardReportApi();
    console.log(this.result)
    this.data = this.transformApiResponse(this.apiResponse);
    const response = await this.localStorage.getLocalData(localKeys.USER_DETAILS);
    if (response) {
      this.user = await this.profileService.getUserRole(response);
    }

    // big number form

    let bigNumberFormConfig = BIG_NUMBER_DASHBOARD_FORM;
    const bigNumberResult = await this.form.getForm(bigNumberFormConfig);
    this.bigNumberFormData = _.get(bigNumberResult, 'data.fields');
    this.filteredCards = !this.filteredCards.length ? this.bigNumberFormData[this.user[0]].bigNumbers : [];

    this.handleRoleChange({ detail: { value: this.user[0] } });
  }

  public headerConfig: any = {
    menu: true,
    label: 'DASHBOARD_PAGE',
    headerColor: 'primary',
  };


  downloadData() {
    console.log('Download initiated');
  }

  selectRoles() {
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

    console.log('Start Date:', formattedStartDate, startDateEpoch);
    console.log('End Date:', formattedEndDate, endDateEpoch);
  }

  handleRoleChange(e) {
    const selectedRole = e.detail.value;
    this.filteredFormData = this.bigNumberFormData[selectedRole] || [];
    this.filteredCards = this.filteredFormData?.bigNumbers || [];

    const formConfig = this.filteredFormData.form;
    this.dynamicFormControls = formConfig?.controls || [];
  }
  handleSessionTypeChange(event) {

  }
  handleEntityChange(event) {

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




  handleFormControlChange(controlName: string, event: any) {
    const selectedValue = event.detail.value;
    console.log(`${controlName} changed to: ${selectedValue}`);
    // Handle control-specific logic here
  }

  async dashboardReportApi() {
    const config = {
      url: urlConstants.API_URLS.DASHBOARD_REPORTING + 'filter_type=' + this.filterType + '&' + 'report_filter=' + true,
      payload: {},
    };
    try {
      let data: any = await this.httpService.get(config);
      return data.result
    }
    catch (error) {
    }
  }


}
