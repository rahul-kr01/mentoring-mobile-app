import * as _ from 'lodash';
import { BIG_NUMBER_DASHBOARD_FORM } from 'src/app/core/constants/formConstant';
import { HttpService } from 'src/app/core/services';
import { FormService } from 'src/app/core/services/form/form.service';
import * as moment from 'moment';
import { urlConstants } from 'src/app/core/constants/urlConstants';
import { Component, OnInit } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { ProfileService } from 'src/app/core/services/profile/profile.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.page.html',
  styleUrls: ['dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  user: any;
  sessions: any;
  filteredCards: any[] = [];
  bigNumbersConfig: any;
  startDate: moment.Moment;
  endDate: moment.Moment;

  ///// chart api demo response
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
  //////
  data: any;

  dynamicFormControls: any[] = [];
  filteredFormData: any;
  bigNumberFormData: any;
  result: any;
  selectedRole: any;
  report_code: any;
  session_type: any = 'ALL';
  filterType: any = 'session';
  selectedDuration: any = 'month';
  endDateEpoch: number;
  startDateEpoch: number;
  categories: any;
  tableDataDownload: boolean = false;
  loading: boolean = false;
  chartData: any;
  completeDashboardForms: any;
  chartCreationJson: any;
  isMentor: boolean;
  segment: string;
  dataAvailable: boolean;
  chart: any;

  constructor(
    private profile: ProfileService,
    private apiService: HttpService,
    private form: FormService) { }

  ionViewWillEnter() {
    this.isMentor = this.profile.isMentor;
    this.segment = this.isMentor ? "mentor" : "mentee";
    this.dataAvailable = true;
  }

  async ngOnInit() {
    this.result = await this.reportFilterListApi();
    this.user = await this.getUserRole(this.result);
    this.data = this.transformApiResponse(this.apiResponse);

    // big number form

    const bigNumberResult = await this.form.getForm(BIG_NUMBER_DASHBOARD_FORM);
    this.bigNumberFormData = _.get(bigNumberResult, 'data.fields');
    this.filteredCards = !this.filteredCards.length ? this.bigNumberFormData[this.user[0]].bigNumbers : [];
    if(this.user){
      this.calculateDuration();
      this.handleRoleChange({ detail: { value: this.user[0] } });
      this.bigNumberCount();
    }
  }

  public headerConfig: any = {
    menu: true,
    label: 'DASHBOARD_PAGE',
    headerColor: 'primary',
  };


  async downloadData() {
    console.log('Download initiated');
    this.tableDataDownload = true;
  }


  calculateDates(event): void {
    this.selectedDuration = event.detail.value;
    this.calculateDuration();
    this.bigNumberCount();
  }

  async calculateDuration(){
    const today = moment();
    const firstDayOfYear = moment().startOf('year');
    const lastDayOfYear = moment().endOf('year');

    switch (this.selectedDuration) {
      case 'week':
        this.startDate = today.clone().startOf('week');
        this.endDate = today.clone().endOf('week');
        break;
      case 'month':
        this.startDate = today.clone().startOf('month');
        this.endDate = today.clone().endOf('month');
        break;
      case 'quarter':
        this.startDate = today.clone().startOf('quarter');
        this.endDate = today.clone().endOf('quarter');
        break;
      case 'year':
        this.startDate = firstDayOfYear.clone();
        this.endDate = lastDayOfYear.clone();
        break;
      default:
        this.startDate = null;
        this.endDate = null;
    }

    // const formattedStartDate = this.startDate ? this.startDate.format('DD/MM/YYYY HH:mm [IST]') : null;
    // const formattedEndDate = this.endDate ? this.endDate.format('DD/MM/YYYY HH:mm [IST]') : null;

    const startDateEpoch = this.startDate ? this.startDate.valueOf() : null;
    const endDateEpoch = this.endDate ? this.endDate.valueOf() : null;

    this.startDateEpoch = startDateEpoch;
    this.endDateEpoch = endDateEpoch;
  }

  async handleRoleChange(e) {
    this.selectedRole = e.detail.value;
    this.filteredFormData = this.bigNumberFormData[this.selectedRole] || [];
    this.filteredCards = this.filteredFormData?.bigNumbers || [];
    if(this.filteredCards){
      this.bigNumberCount();
    }

    const formConfig = this.filteredFormData.form;
    this.dynamicFormControls = formConfig?.controls || [];
    this.updateFormData(this.result);
    this.preparedUrl()
  }

  async bigNumberCount(){
    for (const element of this.filteredCards) {
      this.report_code = element.Url;
      this.preparedUrl(element.value)
    }
  }


  /// chart related code

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
  

/////////


  handleFormControlChange(value: any,event: any) {
    switch(value) {
      case 'duration':
        this.selectedDuration = event.detail.value;
        this.calculateDuration();
        break;
      
      case 'type':
        this.session_type = event.detail.value;
        break;
      
      case 'categories':
        this.categories = event.detail.value;
        break;
    }

    this.bigNumberCount();
    this.preparedUrl()
  }

  async updateFormData(formData){
    Object.keys(this.bigNumberFormData).forEach((role) => {
      const roleData = this.bigNumberFormData[role];
      const firstObject = this.transformData(roleData, formData);
      this.dynamicFormControls = firstObject.form.controls;
    });
  }

  transformData(firstObj: any, secondObj: any): any {
    const updatedFirstObj = JSON.parse(JSON.stringify(firstObj));

    updatedFirstObj.form.controls = updatedFirstObj.form.controls.map((control: any) => {
      const matchingEntityType = secondObj.entity_types[control.value];

      if (matchingEntityType) {
        return {
          ...control,
          entities: matchingEntityType[0].entities, // Replace entities with matching data
          type: 'select', // Retain the 'select' type,
          label: matchingEntityType[0].label,
        };
      }

      return control; // If no match, return the original control
    });

    return updatedFirstObj;
  }

  async reportFilterListApi() {
    const config = {
      url: urlConstants.API_URLS.DASHBOARD_REPORT_FILTER + 'filter_type=' + this.filterType + '&' + 'report_filter=' + true,
      payload: {},
    };
    try {
      let data: any = await this.apiService.get(config);
      return data.result
    }
    catch (error) {
    }
  }

  async reportData(url){
    const config = {
      url: url,
      payload: {},
    };
    try {
      let data: any = await this.apiService.get(config);
      return data.result
    }
    catch (error) {
    }
  }
  getUserRole(userDetails) {
    var roles = userDetails.roles.map(function(item) {
      return item['title'];
    });
    if (!roles.includes("mentee")) {
      roles.unshift("mentee");
    }
    return roles
  }
  createChart() {
    this.chartCreationJson = this.segment === 'mentor' ? JSON.parse(JSON.stringify(this.completeDashboardForms.mentor)) : JSON.parse(JSON.stringify(this.completeDashboardForms.mentee))
    const maxDataValue = Math.max(
      ...(
          this.segment === 'mentor' ?
          [this.chartData.total_session_created, this.chartData.total_session_assigned, this.chartData.total_session_hosted] :
          [this.chartData.total_session_enrolled, this.chartData.total_session_attended]
      )
  );
  this.chartCreationJson.forEach(chart => {
    if (chart.options && chart.options.scales && chart.options.scales.y && chart.options.scales.y.ticks) {
      chart.options.scales.y.ticks.stepSize = this.calculateStepSize(maxDataValue);
    }
    if (chart.data && chart.data.datasets) {
      chart.data.datasets.forEach(dataset => {
        dataset.data = dataset.data.map(item => this.chartData[item] || 0);
      });
    }
  });
    this.chart = new Chart('MyChart', this.chartCreationJson[0]);
    this.dataAvailable = !!(this.chartData?.total_session_created ||this.chartData?.total_session_enrolled ||this.chartData?.total_session_assigned ||this.chartData?.total_session_hosted);
  }

  calculateStepSize(maxDataValue) {
    return Math.ceil(maxDataValue / 5);
  }


  async preparedUrl(value?){
    let params = urlConstants.API_URLS.DASHBOARD_REPORT_DATA + 
    'report_code=' + this.report_code + 
    '&report_role=' + this.selectedRole + 
    '&session_type=' + this.session_type +
    '&start_date=' + (this.startDateEpoch ? this.startDateEpoch:'') + '&end_date='+ (this.endDateEpoch ? this.endDateEpoch : '') + 
    '&entities_value=' + (this.categories ? this.categories : '');
    const resp =  await this.reportData(params)
    if(value){
      value = resp.data.count;
    }
    }
}

