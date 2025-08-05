# **@multimediafabrik/tour-react**

A robust React component for embedding Pano2VR virtual tours, built on top of the @multimediafabrik/tour library.

This component is designed for seamless integration into modern React applications and automatically handles common issues like WebGL memory leaks by running the tour inside a sandboxed \<iframe\>.

## **Features**

* **Easy Integration**: Drop the \<Panorama\> component into your React app to get started.  
* **Memory Leak Prevention**: Automatically isolates the Pano2VR player in a sandboxed environment to ensure WebGL contexts are properly cleaned up.  
* **Custom Loading Elements**: Pass any React component as children to serve as a custom loading indicator or cover element while the tour initializes.  
* **Responsive**: Designed to be fully responsive and will fill its parent container by default.  
* **Interactive**: Control the starting position and receive updates on position changes through a simple props-based API.

## **Installation**

To install the package and its peer dependencies, run the following command in your project's terminal:

npm install @multimediafabrik/tour-react

## **Basic Usage**

Import the Panorama component and provide it with the required basepath. You can also pass a custom component as children to act as a loading screen.

import Panorama from '@multimediafabrik/tour-react';  
import type { PanoPosition, TransitionSettings } from '@multimediafabrik/tour-react';

// A custom loading component  
const TourLoader \= () \=\> (  
  \<div style={{  
    width: '100%',  
    height: '100%',  
    display: 'flex',  
    justifyContent: 'center',  
    alignItems: 'center',  
    backgroundColor: '\#222',  
    color: 'white',  
    fontFamily: 'sans-serif',  
  }}\>  
    \<h2\>Loading Virtual Tour...\</h2\>  
  \</div\>  
);

function App() {  
  const tourDataPath \= "https://your-server.com/path/to/tour/data/";

  const handlePositionChange \= (position: PanoPosition) \=\> {  
    console.log('Debounced position changed:', position);  
  };

  const transition: TransitionSettings \= {  
    type: 'crossdissolve',  
    before: 2, // zoomin  
    after: 3, // zoomout  
    transitiontime: 1.5,  
  };

  return (  
    \<div style={{ width: '100vw', height: '100vh' }}\>  
      \<Panorama  
        basepath={tourDataPath}  
        node={1}  
        fov={80}  
        onPositionChange={handlePositionChange}  
        transition={transition}  
      \>  
        \<TourLoader /\>  
      \</Panorama\>  
    \</div\>  
  );  
}

export default App;

## **Props API**

The \<Panorama\> component accepts the following props:

| Prop | Type | Required | Description |
| :---- | :---- | :---- | :---- |
| basepath | string | **Yes** | The base URL path to the directory containing your tour's pano.xml. The component is recreated when this changes. |
| children | React.ReactNode | No | A React child component to render inside the tour container. Ideal for a loading indicator, as it's replaced once the tour initializes. |
| node | number | No | The starting node ID for the panorama. |
| fov | number | No | The initial field of view (zoom level). Defaults to 70\. |
| pan | number | No | The initial horizontal pan angle. Defaults to 0\. |
| tilt | number | No | The initial vertical tilt angle. Defaults to 0\. |
| singleImage | boolean | No | If true, hides the skin and UI elements of the Pano2VR player. Defaults to false. |
| transition | TransitionSettings | No | An object to configure the transition effects between nodes. See TransitionSettings type below for details. |
| onPositionChange | (position: PanoPosition) \=\> void | No | A debounced callback that fires after the user stops changing the view. It receives a PanoPosition object. |

### **PanoPosition Type**

The onPositionChange callback receives an object with the following structure:

type PanoPosition \= {  
  basepath: string;  
  node: number;  
  fov: number;  
  pan: number;  
  tilt: number;  
};

### **TransitionSettings Type**

The transition prop accepts an object with the following structure to customize the effects when changing nodes.

type TransitionSettings \= {  
  type: 'cut' | 'crossdissolve' | 'diptocolor' | 'irisround' | 'irisrectangular' | 'wipeleftright' | 'wiperightleft' | 'wipetopbottom' | 'wipebottomtop' | 'wiperandom';  
  before?: 0 | 2; // 0 for none, 2 for zoomin  
  after?: 0 | 2 | 3 | 4; // 0 for none, 2 for zoomin, 3 for zoomout, 4 for flyin  
  transitiontime?: number;  
  waitfortransition?: boolean;  
  zoomedfov?: number;  
  zoomspeed?: number;  
  dipcolor?: string; // e.g., '0xff0000' for red  
  softedge?: number;  
};

**TransitionSettings Properties:**

| Property | Type | Description |
| :---- | :---- | :---- |
| type | string | The main transition effect type. |
| before | number | The effect to apply before the main transition starts (0: none, 2: zoom in). |
| after | number | The effect to apply after the main transition ends (0: none, 2: zoom in, 3: zoom out, 4: fly in). |
| transitiontime | number | The duration of the main transition in seconds. |
| waitfortransition | boolean | If true, the after effect will wait for the main transition to finish completely. |
| zoomedfov | number | The field of view to zoom to when a zoomin effect is selected. |
| zoomspeed | number | The speed of the zoom effect. |
| dipcolor | string | The hexadecimal color (e.g., '0x000000') to use when type is set to diptocolor. |
| softedge | number | The size of the soft edge for iris and wipe transitions. |

## **License**

This project is licensed under the Apache-2.0 License.