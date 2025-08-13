# **Changelog**

All notable changes to this project will be documented in this file.
## **\[0.1.15\] \- 2025-08-05**

### **Added**

* Added Tailwind support for the children prop
## **\[0.1.14\] \- 2025-08-05**

### **Added**

* Implemented the transition prop to allow for detailed configuration of node change effects.  
* Added support for the children prop, enabling users to pass custom React components to serve as loading or cover elements.

## **\[0.1.13\] \- 2025-08-05**

### **Fixed**

* Resolved ReferenceError for \_\_WRAPPER\_CODE\_\_ in external projects by correcting the tsup build configuration.  
* Ensured the pano2vr\_player.js script executes correctly when loaded into an iframe.

### **Added**

* Added README.md to explain usage

## **\[0.1.12\] \- 2025-08-04**

### **Fixed**

* Solved build failures by correctly configuring the package for use in a monorepo.  
* Added support for raw file imports in the example app's Webpack config.

### **Added**

* Implemented a self-contained iframe sandbox to prevent WebGL memory leaks.  
* Added the onPositionChange prop to receive debounced position updates.

## **\[0.2\] \- 2025-08-13**

### **Fixed**
  
* Fixed onPositionChange not firing when position is updated

## **\[0.2.1\] \- 2025-08-13**

### **Fixed**
  
* onPositionChange now fires at load
* Fixed race conditions breaking position updates on basepath changes

## **\[0.2.2\] \- 2025-08-13**

### **Fixed**
  
* fixed position periodically jumping back to starting position after user moves