import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-hammals',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    NgxPaginationModule
  ],
  templateUrl: './hammals.component.html',
  styleUrl: './hammals.component.css'
})
export class HammalsComponent {

  isEdit: 'Update' | 'Add' | undefined;

  data: any[] = [];


  masterToAddOrEdit: any = {};
  masterToAddOrEditIndex: number = -1;
  p: number = 1;
  limit: number = 10;
  total: number = 0;
  masterName: string = 'Hammals';

  constructor(
    private apiService: ApiService
  ) {
    this.getData();
  }



  getData() {
    this.apiService.get('hammals', {
      params: {
        page: this.p,
        limit: this.limit
      }
    }).subscribe((data: any) => {
      this.data = data.data;
      this.total = data.meta.total;
      this.p = data.meta.current_page;
      this.limit = data.meta.per_page;
    });
  }

  selectItemToEdit(index: number) {
    // this.masterToAddOrEdit = this.data[index];
    this.masterToAddOrEdit = Object.assign({}, this.data[index]);
    this.masterToAddOrEditIndex = index
    this.isEdit = 'Update';
  }

  selectItemToAdd() {
    this.masterToAddOrEdit = {};
    this.isEdit = 'Add';
  }

  addNewItem() {
    if (this.masterToAddOrEdit.name === '') {
      return;
    }
    this.apiService.post('hammals', this.masterToAddOrEdit).subscribe((data: any) => {
      this.getData();
      this.resetMasterToAddOrEdit();
    });
  }

  resetMasterToAddOrEdit() {
    this.masterToAddOrEdit = {};
    this.masterToAddOrEditIndex = -1;
    this.isEdit = undefined;
  }

  editItem(index: number) {
    if (this.masterToAddOrEditIndex === -1) {
      return;
    }
    if (this.masterToAddOrEdit.name === '') {
      return;
    }
    if (confirm('Are you sure you want to update this hammal?')) {
      if (this.masterToAddOrEditIndex === -1) {
        return;
      }
      this.apiService.put(`hammals/${this.masterToAddOrEdit._id}`, this.masterToAddOrEdit).subscribe((data: any) => {
        this.getData();
        this.resetMasterToAddOrEdit();
      });
    }
  }

  deleteItem(index: number) {
    if (confirm('Are you sure you want to delete this hammal?')) {
      this.apiService.delete(`hammals/${this.data[index]._id}`).subscribe((data: any) => {
        this.getData();
      });
    }
  }

}
