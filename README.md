
# InternationalPhone

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.3.0.

## Configuration

- **ng-packagr** is a node library that can compile and package a TypeScript library to Angular Package Format
as per the `ng-packagr` docs, we’ll need to add two files to our project, `ng-package.json` and `public_api.ts`.
-- We’ll use `ng-package.json` to configure `n-packagr` and to tell it where to find our `public_api.ts` file, which we’ll use to export the feature modules of our component library. (Note: `public_api.ts`is a convention used by Angular component libraries.)
- **ng-package.json**
`{
	"$schema": "./node_modules/ng-packagr/ng-package.schema.json",  "lib": {  "entryFile": "public_api.ts"  
}  
}`

- **public_api.ts**
`export * from './src/app/modules/phone-validator/phone-number.module'`

- **dist-package.json** manage npm package [package-name, verion, keywords, description]

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.


## Build
- **ng build [package-name]**


## Publish to npm 

- **npm publish** run this command inside the **dist** folder  to publish the package to npm.