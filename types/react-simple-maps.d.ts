// Local ambient types for react-simple-maps@3.0.0.
//
// The installed package ships no .d.ts files of its own (checked directly:
// find node_modules/react-simple-maps -iname "*.d.ts" turns up nothing) and
// @types/react-simple-maps isn't installed either — and this sandbox can't
// reach the npm registry to check whether that package even exists or what
// it covers, so pulling it in isn't an option right now. These declarations
// are hand-written from reading the actual shipped source
// (node_modules/react-simple-maps/dist/index.es.js) rather than copied from
// memory or guessed, and only cover the pieces WorldMap.tsx actually uses:
// ComposableMap, Geographies, Geography, Sphere, Graticule, ZoomableGroup.
declare module 'react-simple-maps' {
  import type { ReactNode, RefAttributes, SVGProps } from 'react'

  // geoPath()(feature) output, plus whatever the source GeoJSON/TopoJSON
  // feature carried (id, properties, geometry, ...) — kept loose since
  // WorldMap.tsx only reads geo.rsmKey and geo.properties?.name off of this.
  export interface GeographyObject {
    rsmKey: string
    svgPath: string
    id?: string | number
    properties?: Record<string, unknown>
    geometry?: unknown
    type?: string
    [key: string]: unknown
  }

  export interface ComposableMapProps {
    width?: number
    height?: number
    projection?: string | ((...args: unknown[]) => unknown)
    projectionConfig?: {
      center?: [number, number]
      rotate?: [number, number, number]
      scale?: number
      parallels?: [number, number]
    }
    className?: string
    children?: ReactNode
  }
  export const ComposableMap: React.ForwardRefExoticComponent<
    ComposableMapProps & SVGProps<SVGSVGElement> & RefAttributes<SVGSVGElement>
  >

  export interface GeographiesChildrenArg {
    geographies: GeographyObject[]
    outline?: GeographyObject
    borders?: GeographyObject
    path: (feature: unknown) => string
    projection: unknown
  }
  export interface GeographiesProps {
    // A URL string is fetched by the library itself at runtime (browser
    // fetch); an object is treated as already-loaded GeoJSON/TopoJSON.
    geography: string | Record<string, unknown>
    children: (arg: GeographiesChildrenArg) => ReactNode
    parseGeographies?: (features: unknown[]) => unknown[]
    className?: string
  }
  export const Geographies: React.ForwardRefExoticComponent<
    GeographiesProps & RefAttributes<SVGGElement>
  >

  export interface GeographyStyle {
    default?: React.CSSProperties
    hover?: React.CSSProperties
    pressed?: React.CSSProperties
  }
  export interface GeographyProps
    extends Omit<SVGProps<SVGPathElement>, 'style' | 'onFocus' | 'onBlur'> {
    geography: GeographyObject
    style?: GeographyStyle
    onFocus?: (event: React.FocusEvent<SVGPathElement>) => void
    onBlur?: (event: React.FocusEvent<SVGPathElement>) => void
  }
  export const Geography: React.ForwardRefExoticComponent<
    GeographyProps & RefAttributes<SVGPathElement>
  >

  export interface SphereProps extends SVGProps<SVGPathElement> {
    id?: string
  }
  export const Sphere: React.ForwardRefExoticComponent<
    SphereProps & RefAttributes<SVGPathElement>
  >

  export interface GraticuleProps extends SVGProps<SVGPathElement> {
    step?: [number, number]
  }
  export const Graticule: React.ForwardRefExoticComponent<
    GraticuleProps & RefAttributes<SVGPathElement>
  >

  export interface ZoomPanEventArg {
    coordinates: [number, number]
    zoom: number
  }
  export interface ZoomableGroupProps {
    center?: [number, number]
    zoom?: number
    minZoom?: number
    maxZoom?: number
    translateExtent?: [[number, number], [number, number]]
    filterZoomEvent?: (event: unknown) => boolean
    onMoveStart?: (arg: ZoomPanEventArg, event: unknown) => void
    onMove?: (arg: { x: number; y: number; zoom: number; dragging: unknown }, event: unknown) => void
    onMoveEnd?: (arg: ZoomPanEventArg, event: unknown) => void
    className?: string
    children?: ReactNode
  }
  export const ZoomableGroup: React.ForwardRefExoticComponent<
    ZoomableGroupProps & RefAttributes<SVGGElement>
  >
}
