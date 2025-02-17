import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../produits.service';
import { Produit } from '../models/produit.model';
import { CartService } from '../cart.service';

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.css']
})
export class ProductDetailsComponent implements OnInit {
  produit: Produit | undefined;
  upsellingProducts: any[] = []; // Array to hold upselling products
  quantity: number = 1;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    const productId = +this.route.snapshot.paramMap.get('id')!;
    this.loadProductDetails(productId);
    this.loadUpsellingProducts(productId);
  }

  loadProductDetails(productId: number): void {
    this.productService.getProductDetails([productId]).subscribe(
      (produits: Produit[]) => {
        this.produit = produits[0]; 
      },
      (error) => {
        console.error('Error loading product details', error);
      }
    );
  }

  loadUpsellingProducts(productId: number): void {
    this.productService.getUpsellingProducts(productId).subscribe(
      (products) => {
        this.upsellingProducts = products;
      },
      (error) => {
        console.error('Error loading upselling products', error);
      }
    );
  }

  increaseQuantity(): void {
    if (this.produit && this.produit.stock !== undefined && this.quantity < this.produit.stock) {
      this.quantity++;
    }
  }
  
  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }
  
  addToCart(): void {
    if (this.produit) {
      this.cartService.addToCart(this.produit, this.quantity);
    }
  }
}
