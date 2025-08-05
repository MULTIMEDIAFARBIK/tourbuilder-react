# **@multimediafabrik/tour-react**

A robust React component for embedding Pano2VR virtual tours, built on top of the @multimediafabrik/tour library.

This component is designed for seamless integration into modern React applications and automatically handles common issues like WebGL memory leaks by running the tour inside a sandboxed \<iframe\>.

## **Features**

* **Easy Integration**: Drop the \<Panorama\> component into your React app to get started.  
* **Memory Leak Prevention**: Automatically isolates the Pano2VR player in a sandboxed environment to ensure WebGL contexts are properly cleaned up, preventing browser crashes on repeated use.  
* **Responsive**: The component is designed to be fully responsive and will fill its parent container by default.  
* **Interactive**: Control the starting position of the tour and receive updates on position changes through a simple props-based API.

## **Installation**

To install the package and its peer dependencies, run the following command in your project's terminal:

npm install @multimediafabrik/tour-react

## **Basic Usage**

Import the Panorama component and provide it with the required basepath to your tour's data files.

import Panorama from '@multimediafabrik/tour-react';  
import type { PanoPosition } from '@multimediafabrik/tour-react';

function App() {  
  const tourDataPath \= "https://your-server.com/path/to/tour/data/";

  const handlePositionChange \= (position: PanoPosition) \=\> {  
    console.log('Debounced position changed:', position);  
    // You can use this data to update the URL or parent component state  
  };

  return (  
    \<div style={{ width: '100vw', height: '100vh' }}\>  
      \<Panorama  
        basepath={tourDataPath}  
        node={1}  
        fov={80}  
        onPositionChange={handlePositionChange}  
      /\>  
    \</div\>  
  );  
}

export default App;

## **Props API**

The \<Panorama\> component accepts the following props:

| Prop | Type | Required | Description |
| :---- | :---- | :---- | :---- |
| basepath | string | **Yes** | The base URL path to the directory containing your tour's pano.xml and tile images. The component is automatically recreated when this changes. |
| node | number | No | The starting node ID for the panorama. |
| fov | number | No | The initial field of view (zoom level). Defaults to 70\. |
| pan | number | No | The initial horizontal pan angle. Defaults to 0\. |
| tilt | number | No | The initial vertical tilt angle. Defaults to 0\. |
| singleImage | boolean | No | If true, hides the skin and UI elements of the Pano2VR player. Defaults to false. |
| onPositionChange | (position: PanoPosition) \=\> void | No | A debounced callback function that fires after the user stops changing the view. It receives a PanoPosition object with the latest view data. |

### **PanoPosition Type**

The onPositionChange callback receives an object with the following structure:

type PanoPosition \= {  
  basepath: string;  
  node: number;  
  fov: number;  
  pan: number;  
  tilt: number;  
};

## **License**

This project is licensed under the Apache-2.0 License.