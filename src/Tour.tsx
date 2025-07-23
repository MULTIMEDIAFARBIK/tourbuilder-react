import Panorama, { PanoramaProps } from './Panorama';

interface TourProps extends PanoramaProps{
    
}

export default function Tour({basepath, children, ...props}: TourProps) {
  return (
      <Panorama basepath={basepath} {...props} >
        {children}
      </Panorama>
  );
}