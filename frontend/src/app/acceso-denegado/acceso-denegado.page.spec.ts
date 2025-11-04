import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccesoDenegadoPage } from './acceso-denegado.page';

describe('AccesoDenegadoPage', () => {
  let component: AccesoDenegadoPage;
  let fixture: ComponentFixture<AccesoDenegadoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AccesoDenegadoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
