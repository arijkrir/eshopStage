import { Component, OnInit, Output, EventEmitter, ElementRef, HostListener, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductService } from '../produits.service';
import { Produit } from '../models/produit.model';
import { CartService } from '../cart.service';

@Component({
  selector: 'app-productlist-scrollable',
  templateUrl: './produits.component.html',
  styleUrls: ['./produits.component.css']
})
export class ProductlistScrollableComponent implements OnInit {
  produits: Produit[] = [];
  allProductIds: number[] = [];
  offset = 0;
  limit = 1000;
  loading = false;
  hasMoreProduits = true;
  scrollDistance = 100; 
  scrollUpDistance = 1; 
  searchTerm: string = '';
  category: string = '';
  showCart = false;
  showAccountOptions = false;
  cartItems: Produit[] = [];

  @Output() cartItemCountChanged = new EventEmitter<number>();

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService, 
    private el: ElementRef, 
    private router: Router, 
    private cartService: CartService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.searchTerm = params['search'] || '';
      this.category = params['category'] || '';

      if (this.searchTerm || this.category) {
        this.loadFilteredProducts(this.searchTerm, this.category);
      } else {
        this.produits = [];
        this.offset = 0;
        this.limit = 1000;
        if (this.category) {
          this.loadCategoryProducts(this.category);
        } else {
          this.loadProductIds();
        }
      }
    });

    this.loadCartItemsFromLocalStorage();
  }

  loadFilteredProducts(term: string, category: string): void {
    if (category) {
      this.productService.getCategoryProductIds(category, this.offset, this.limit).subscribe(
        (ids: number[]) => {
          if (ids.length < this.limit) {
            this.hasMoreProduits = false;
          }
          this.allProductIds.push(...ids);
          this.loadCategoryProductDetails(ids, category, 'details');
          this.loadCategoryProductDetails(ids, category, 'csv');
          this.loadCategoryProductDetails(ids, category, 'ftp');
        },
        (error) => {
          console.error('Error fetching category product IDs', error);
        }
      );
    } else {
      this.productService.searchProducts(term).subscribe(
        (results: Produit[]) => {
          this.produits = results;
          const ids = results.map(p => p.id);
          this.loadProductDetails(ids);
          this.loadProductQuantities(ids);
        },
        (error) => {
          console.error('Error fetching search results', error);
        }
      );
    }
  }

  loadCategoryProducts(category: string): void {
    if (this.loading || !this.hasMoreProduits) return;

    this.loading = true;

    this.productService.getCategoryProductIds(category, this.offset, this.limit).subscribe(
      (ids: number[]) => {
        if (ids.length < this.limit) {
          this.hasMoreProduits = false;
        }
        this.allProductIds.push(...ids);
        this.loadCategoryProductDetails(ids, category, 'details');
        this.loadCategoryProductDetails(ids, category, 'csv');
        this.loadCategoryProductDetails(ids, category, 'ftp');
        this.loading = false;
      },
      (error) => {
        console.error('Error loading category product IDs', error);
        this.loading = false;
      }
    );
  }

  loadCategoryProductDetails(ids: number[], category: string, source: string): void {
    this.productService.getCategoryProductDetails(ids, category, source).subscribe(
      (produits: Produit[]) => {
        produits.forEach(newProduct => {
          const existingProduct = this.produits.find(product => product.id === newProduct.id);
          if (existingProduct) {
            existingProduct.quantity = 1; 
          } else {
            newProduct.quantity = 1;
            this.produits.push(newProduct);
          }
        });

        if (source === 'csv') {
          this.productService.getCategoryProductDetails(ids, category, 'ftp').subscribe(
            (produitsFTP: Produit[]) => {
              produitsFTP.forEach(productFTP => {
                const existingProduct = this.produits.find(p => p.id === productFTP.id);
                if (existingProduct) {
                  existingProduct.stock = productFTP.quantity;
                  existingProduct.available = existingProduct.stock > 0;
                }
              });
            },
            (error) => {
              console.error('Error loading product quantities from FTP', error);
            }
          );
        }

        this.offset += 1000;
        this.limit += 1000;
      },
      (error) => {
        console.error(`Error loading product details from ${source}`, error);
      }
    );
  }

  loadProductIds(): void {
    if (this.loading || !this.hasMoreProduits) return;

    this.loading = true;

    this.productService.getAllProductIds(this.offset, this.limit).subscribe(
      (ids: number[]) => {
        if (ids.length < 1000) {
          this.hasMoreProduits = false;
        }
        this.allProductIds.push(...ids);
        this.loadProductDetails(ids);
        this.loadProductQuantities(ids);
        this.loading = false;
      },
      (error) => {
        console.error('Error loading product IDs', error);
        this.loading = false;
      }
    );
  }

  loadProductDetails(ids: number[]): void {
    this.productService.getProductDetails(ids).subscribe(
      (produits: Produit[]) => {
        produits.forEach(newProduct => {
          const existingProduct = this.produits.find(product => product.id === newProduct.id);
          if (existingProduct) {
            existingProduct.quantity = 1; 
          } else {
            newProduct.quantity = 1;
            this.produits.push(newProduct);
          }
        });

        this.offset += 1000;
        this.limit += 1000;
      },
      (error) => {
        console.error('Error loading product details', error);
      }
    );
  }

  loadProductQuantities(ids: number[]): void {
    this.productService.getProductDetailsFromFTPByIds(ids).subscribe(
      (produitsFTP: Produit[]) => {
        produitsFTP.forEach(productFTP => {
          const existingProduct = this.produits.find(p => p.id === productFTP.id);
          if (existingProduct) {
            existingProduct.stock = productFTP.quantity;
            existingProduct.available = existingProduct.stock > 0;
          }
        });
      },
      (error) => {
        console.error('Error loading product quantities from FTP', error);
      }
    );
  }

  loadMoreProduits(): void {
    if (this.category) {
      this.loadCategoryProducts(this.category);
    } else {
      this.loadProductIds();
    }
  }

  onScroll(): void {
    if (!this.hasMoreProduits) return;

    this.loadMoreProduits();
  }

  onSearch(searchTerm: string): void {
    this.router.navigate([], {
      queryParams: { search: searchTerm },
      queryParamsHandling: 'merge',
    });
  }

  toggleCart(): void {
    this.showCart = !this.showCart;
  }

  toggleAccountOptions(): void {
    this.showAccountOptions = !this.showAccountOptions;
  }

  addToCart(produit: Produit): void {
    const cartItem = this.cartItems.find(item => item.id === produit.id);

    if (cartItem) {
      cartItem.quantity += produit.quantity;
    } else {
      this.cartItems.push({ ...produit });
    }

    this.saveCartItemsToLocalStorage();
    this.cartItemCountChanged.emit(this.cartItems.length);
  }

  saveCartItemsToLocalStorage(): void {
    localStorage.setItem('cartItems', JSON.stringify(this.cartItems));
  }

  loadCartItemsFromLocalStorage(): void {
    const savedCartItems = localStorage.getItem('cartItems');
    if (savedCartItems) {
      this.cartItems = JSON.parse(savedCartItems);
    }
  }
}
