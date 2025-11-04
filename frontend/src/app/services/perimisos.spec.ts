import { TestBed } from '@angular/core/testing';

import { Perimisos } from './perimisos';

describe('Perimisos', () => {
  let service: Perimisos;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Perimisos);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
