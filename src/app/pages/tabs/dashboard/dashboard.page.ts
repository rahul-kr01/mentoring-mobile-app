import * as _ from 'lodash';
import { BIG_NUMBER_DASHBOARD_FORM } from 'src/app/core/constants/formConstant';
import { HttpService } from 'src/app/core/services';
import { FormService } from 'src/app/core/services/form/form.service';
import * as moment from 'moment';
import { urlConstants } from 'src/app/core/constants/urlConstants';
import { Component, OnInit } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { ProfileService } from 'src/app/core/services/profile/profile.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.page.html',
  styleUrls: ['dashboard.page.scss'],
})
export class DashboardPage implements OnInit {

  user: any;
  sessions: any;
  filteredCards: any = [];
  bigNumbersConfig: any;
  startDate: moment.Moment;
  endDate: moment.Moment;
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
  labels = [];
  groupBy: any;
  chartBody: any = {};
  // this should be come from form confg.
  // chartBodyConfig[this.selectedRole][this.session_type]
  chartBodyConfig :any= {}
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
    const bigNumberResult = await this.form.getForm(BIG_NUMBER_DASHBOARD_FORM);
    this.bigNumberFormData = _.get(bigNumberResult, 'data.fields');
    this.filteredCards = !this.filteredCards.length ? this.bigNumberFormData[this.user[0]] : [];
    this.selectedRole = this.user[0];
    this.filteredFormData = this.bigNumberFormData[this.selectedRole] || [];
    const formConfig = this.filteredFormData.form;
    this.dynamicFormControls = formConfig?.controls || [];
    this.session_type = 'ALL';
    this.chartBodyConfig = this.filteredFormData;
    this.chartBody = this.chartBodyConfig;
    if(this.user){
      this.initialDuration();
    }
  }

  public headerConfig: any = {
    menu: true,
    label: 'DASHBOARD_PAGE',
    headerColor: 'primary',
  };
  async downloadData() {
    this.tableDataDownload = true;
  }

  async initialDuration(){
    const today = moment();
    this.startDate = today.clone().startOf('month').add(1, 'day');
    this.endDate = today.clone().endOf('month');
    this.groupBy = 'day';
    const startDateEpoch = this.startDate ? this.startDate.unix() : null;
    const endDateEpoch = this.endDate ? this.endDate.unix() : null;
    this.startDateEpoch = startDateEpoch;
    this.endDateEpoch = endDateEpoch;
    this.prepareTableUrl();
    this.prepareChartUrl();
    if( this.filteredCards){
      this.bigNumberCount();
    }
  }

  async calculateDuration(){
    const today = moment();
    const firstDayOfYear = moment().startOf('year');
    const lastDayOfYear = moment().endOf('year');
  
    switch (this.selectedDuration) {
      case 'week':
        this.startDate = today.clone().startOf('week').add(1, 'day');
        this.endDate = today.clone().endOf('week');
        this.groupBy = 'day';
        break;
      case 'month':
        this.startDate = today.clone().startOf('month').add(1, 'day');
        this.endDate = today.clone().endOf('month');
        this.groupBy = 'day';
        break;
      case 'quarter':
        this.startDate = today.clone().startOf('quarter').add(1, 'day');
        this.endDate = today.clone().endOf('quarter');
        this.groupBy = 'month';
        break;
      case 'year':
        this.startDate = firstDayOfYear.clone().date(1).add(1, 'day');
        this.endDate = lastDayOfYear.clone();
        this.groupBy = 'month';
        break;
      default:
        this.startDate = null;
        this.endDate = null;
    }

   
    const startDateEpoch = this.startDate ? this.startDate.unix() : null;
    const endDateEpoch = this.endDate ? this.endDate.unix() : null;
    this.startDateEpoch = startDateEpoch;
    this.endDateEpoch = endDateEpoch;
      setTimeout(() => {
       this.bigNumberCount();
       this.prepareChartUrl();
      },100);
  }

  async handleRoleChange(e) {
    this.selectedRole = e.detail.value;
    this.session_type = 'ALL';
    this.categories = '';
    this.filteredFormData = this.bigNumberFormData[this.selectedRole] || [];
    this.filteredCards = this.filteredFormData|| [];
    if(this.filteredCards){
      this.bigNumberCount();
    }
   
    this.updateFormData(this.result);
    this.chartBodyConfig = await this.filteredFormData;
    this.chartBody = this.chartBodyConfig;
    setTimeout(() => { 
      this.prepareChartUrl();
      this.prepareTableUrl();
      },100)
  }

  async bigNumberCount(){
    for (let element of this.filteredCards[this.session_type].bigNumbers) {
      this.report_code = element.Url;
      element.data.forEach(async (el:any) => {
        let value   =  await this.preparedUrl(el.value);
        if(value){
          el.value = value[el.key] || 0;
        }
      })
    }
  }
  

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
    setTimeout(() => {  
    this.prepareChartUrl();
    },100)
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
          entities: matchingEntityType[0].entities, 
          type: 'select',
          label: matchingEntityType[0].label,
        };
      }
      return control;
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
      let data: any = await this.apiService.post(config);
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



  async preparedUrl(value?) {
    const queryParams = `&report_role=${this.selectedRole}` +
      `&session_type=${this.session_type}` +
      `&start_date=${this.startDateEpoch || ''}` +
      `&end_date=${this.endDateEpoch || ''}` +
      `&entities_value=${this.categories || ''}` +
      `&groupBy=${this.groupBy}`;
    const params = `${urlConstants.API_URLS.DASHBOARD_REPORT_DATA}` +
      `report_code=${this.report_code}${queryParams}`;
    const resp = await this.reportData(params);
    if (value) {
      return resp.data;
    }
  }
  async prepareTableUrl(){
    const queryParams = `&report_role=${this.selectedRole}` +
    `&start_date=${this.startDateEpoch || ''}` +
    `&session_type=${this.session_type}` +
    `&end_date=${this.endDateEpoch || ''}`;
  this.chartBody.tableUrl = this.chartBodyConfig.tableUrl;
  setTimeout(() => {
  this.chartBody.tableUrl =  `${environment.baseUrl}${urlConstants.API_URLS.DASHBOARD_REPORT_DATA}` +'report_code='+ this.chartBody.table_report_code +queryParams;}, 10);
  this.chartBody.headers = await this.apiService.setHeaders();
  }
  async prepareChartUrl(){
    this.chartBody.chartUrl ="";
    const queryParams = `&report_role=${this.selectedRole}` +
    `&session_type=${this.session_type}` +
    `&start_date=${this.startDateEpoch || ''}` +
    `&end_date=${this.endDateEpoch || ''}` +
    `&entities_value=${this.categories || ''}` +
    `&groupBy=${this.groupBy}`;
  this.chartBody.chartUrl = this.chartBodyConfig.chartUrl;
  setTimeout(() => {
  this.chartBody.chartUrl = `${environment.baseUrl}${urlConstants.API_URLS.DASHBOARD_REPORT_DATA}` + 'report_code='+ this.chartBody.report_code + queryParams;
  }, 10);
  this.chartBody.headers = await this.apiService.setHeaders();
  }
}

