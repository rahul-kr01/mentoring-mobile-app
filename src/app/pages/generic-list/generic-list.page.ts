import { Component, OnInit, ViewChild} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { FILTER_ROLES } from 'src/app/core/constants/formConstant';
import { paginatorConstants } from 'src/app/core/constants/paginatorConstants';
import { HttpService, UtilService } from 'src/app/core/services';
import { FormService } from 'src/app/core/services/form/form.service';
import { PermissionService } from 'src/app/core/services/permission/permission.service';
import { FilterPopupComponent } from 'src/app/shared/components/filter-popup/filter-popup.component';
import { SearchbarComponent } from 'src/app/shared/components/searchbar/searchbar.component';
import { CommonRoutes } from 'src/global.routes';

@Component({
  selector: 'app-generic-list',
  templateUrl: './generic-list.page.html',
  styleUrls: ['./generic-list.page.scss'],
})
export class GenericListPage implements OnInit {
  @ViewChild('subscribe') searchbarComponent: SearchbarComponent
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  pageSize = paginatorConstants.defaultPageSize;
  pageSizeOptions = paginatorConstants.pageSizeOptions;

  public headerConfig: any = {
    menu: true,
    color: 'primary',
    headerColor: 'primary',
  };

  overlayChips: any;
  routeData: any;
  searchAndCriterias: any;
  filteredDatas: any[];
  filterData: any[];
  selectedChips: boolean;
  chips: any[];
  page: number = 1;
  setPaginatorToFirstpage: boolean;
  urlQueryData: string;
  responseData: any;
  searchText: any;
  totalCount: any;
  isLoaded: boolean;
  criteriaChipEvent: any;
  enableExploreButton: boolean = false;
  valueFromChipAndFilter: any;
  buttonConfig: any;
  noResult: any;

  constructor(private route: ActivatedRoute,
    private httpService: HttpService,
    private modalCtrl: ModalController,
    private utilService: UtilService,
    private formService: FormService,
    private permissionService:PermissionService,
    private router: Router
  ) { }

  ngOnInit() { }

  ionViewWillEnter(){
    this.route.data.subscribe(data => {
      this.routeData = data;
      this.action(this.routeData);
      this.buttonConfig = this.routeData?.button_config;
      this.noResult = this.routeData?.noDataFound;
    });
    this.filterListData(this.routeData.filterType);
    this.getData(this.routeData);
  }

  searchResults(event){
    this.searchAndCriterias = {
      headerData: event,
      routeData: this.routeData
    }
    this.searchAndCriterias = { ...this.searchAndCriterias };
    this.getData(this.searchAndCriterias)
  }
  async getData(data){
    let response = await this.httpService.get({
      url: this.routeData.url + (this.page ? this.page : '')+ 
      '&limit=' + (this.pageSize ? this.pageSize : '') +  
      '&search=' + (data?.headerData?.searchText ? btoa(data.headerData.searchText) : '') + '&' + (this.urlQueryData ? this.urlQueryData: '') + 
      '&search_on=' + (data?.headerData?.criterias?.name ? data?.headerData?.criterias?.name : '')
    })
    this.isLoaded = true;
    this.searchText = data?.headerData?.searchText;
    this.responseData = response.result.data;
    this.totalCount = response?.result?.count;
    this.enableExploreButton = !this.responseData && !this.totalCount && this.routeData?.explore_button;
  }


  async onClickFilter() {
    let modal = await this.modalCtrl.create({
      component: FilterPopupComponent,
      cssClass: 'filter-modal',
      componentProps: { filterData: this.filterData }
    });

    modal.onDidDismiss().then(async (dataReturned) => {
      this.filteredDatas = []
      if (dataReturned.data && dataReturned.data.data) {
        if (dataReturned.data.data.selectedFilters) {
          for (let key in dataReturned.data.data.selectedFilters) {
            this.filteredDatas[key] = dataReturned.data.data.selectedFilters[key].slice(0, dataReturned.data.data.selectedFilters[key].length).map(obj => obj.value).join(',').toString()
          }
          this.selectedChips = true;
        }
        this.extractLabels(dataReturned.data.data.selectedFilters);
        this.getUrlQueryData();
        this.page = 1;
        this.setPaginatorToFirstpage = true;
        this.getData(this.urlQueryData)
      }
    });
    modal.present();
  }


  async filterListData(filterType){
    const obj = {filterType: filterType, org: true};
    let data = await this.formService.filterList(obj);
    this.filterData = await this.utilService.transformToFilterData(data, obj);
    const filterRoles = FILTER_ROLES;
    this.filterData.unshift(filterRoles);
  }
  extractLabels(data) {
    this.chips = [];
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        this.chips.push(...data[key]);
      }
    }
  }

  getUrlQueryData() {
    const queryString = Object.keys(this.filteredDatas)
      .map(key => `${key}=${this.filteredDatas[key]}`)
      .join('&');

      this.urlQueryData = queryString;
  }

  removeChip(event){
    this.chips.splice(event.index, 1);
    this.removeFilteredData(event.chipValue)
    this.getUrlQueryData();

  }

  removeFilteredData(chip: string) {
    Object.keys(this.filteredDatas).forEach(key => {
        let values = this.filteredDatas[key].split(',');
        let chipIndex = values.indexOf(chip);

        if (chipIndex > -1) {
            values.splice(chipIndex, 1);
            this.filteredDatas[key] = values.length ? values.join(',') : delete this.filteredDatas[key];
        }
    });
}

  onPageChange(event){
    this.page = event.pageIndex + 1,
    this.pageSize = this.paginator.pageSize;
    this.getData(event)
  }

  action(event) {
    if(event && event.filterType){
      this.permissionService.getPlatformConfig().then((config)=>{
        this.overlayChips = config?.result?.search_config?.search[event.filterType]?.fields;
       })
    }
  }

  eventAction(event){
    switch (event.type) {
      case 'cardSelect':
        this.router.navigate([CommonRoutes.MENTOR_DETAILS, event?.data?.id]);
        break;
    }
  }

  eventHandler(event: string) {
    this.valueFromChipAndFilter = event;
  }
  
}