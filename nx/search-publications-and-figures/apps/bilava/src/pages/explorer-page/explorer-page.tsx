import {useState, useMemo} from 'react'
import {Grid, GridItem, Box} from '@chakra-ui/react'
import DatasetPanel from '../../components/dataset-panel/dataset-panel'
import ProjectionPanel from '../../components/projection-panel/projection-panel'
import Neighborhood from '../../components/neighborhood/neighborhood'
import {Gallery} from '../../components/gallery/gallery'

import {Dataset, Filter, ScatterDot} from '../../types'

import {findNClosestNeighbors} from '../../utils/neighborhood'
import {makeHull, Point} from '../../utils/convex-hull'
import Filters from '../../components/filters/filters'
import {LabelUpdater} from '../../components/label-updater/label-updater'

/* eslint-disable-next-line */
export interface ExplorerPageProps {}

const INIT_NUM_NEIGHBORS = 32
const INIT_DATASET = {data: [], labels: [], minPrediction: 0, sources: []}
const DEFAULT_FILTERS: Filter = {
  hits: 0.5,
  label: [],
  prediction: [],
  probability: [0, 100],
  source: [],
}

export function ExplorerPage(props: ExplorerPageProps) {
  const project = 'cord19'
  // data fetched from db
  const [dataset, setDataset] = useState<Dataset>(INIT_DATASET)
  // neighborhood state
  const [pointInterest, setPointInterest] = useState<ScatterDot | null>(null)
  const [numNeighbors, setNumNeighbors] = useState<number>(INIT_NUM_NEIGHBORS)
  const [neighborsIdx, setNeighborsIdx] = useState<boolean[]>(
    Array.from({length: INIT_NUM_NEIGHBORS + 1}, () => false),
  )
  const [galleryCandidates, setGalleryCandidates] = useState<ScatterDot[]>([])
  const [brushedData, setBrushedData] = useState<ScatterDot[]>([])
  const [filters, setFilters] = useState<Filter>(DEFAULT_FILTERS)
  const [classifier, setClassifier] = useState<string | null>(null)

  const handleOnLoadData = (dataset: Dataset, classifier: string) => {
    setDataset(dataset) // translated dataset from projections
    setPointInterest(null)
    setNeighborsIdx(Array.from({length: INIT_NUM_NEIGHBORS + 1}, () => false))
    setBrushedData([])
    setGalleryCandidates([])
    setFilters(DEFAULT_FILTERS)
    setClassifier(classifier)
  }

  // neighbors calculated here to allow sharing state between projection and
  // neighborhood views.
  const [neighbors, neighborsConvexHull] = useMemo<
    [ScatterDot[], Point[]]
  >(() => {
    if (!pointInterest) return [[], []]
    const nNeighbors = findNClosestNeighbors(dataset.data, pointInterest, 32)
    const hull = makeHull(nNeighbors.map(p => ({x: p.x, y: p.y})))

    // update indices but keep already selected history
    if (numNeighbors > neighborsIdx.length) {
      const length = neighborsIdx.length - numNeighbors
      const remaining = Array.from({length}, () => false)
      setNeighborsIdx(neighborsIdx.concat(remaining))
    } else if (numNeighbors < neighborsIdx.length) {
      setNeighborsIdx(neighborsIdx.slice(0, numNeighbors + 1))
    }

    return [nNeighbors, hull]
  }, [pointInterest, numNeighbors])

  return (
    <Grid
      w="100hv"
      h="99vh"
      gridTemplateColumns={'300px 1fr 1fr'}
      gridTemplateRows={'25px 1fr 300px'}
      gridGap="0px"
      gridTemplateAreas={`"header header header"
      "dataset projection thumbnails"
      "dataset gallery gallery"
      `}
    >
      <GridItem area={'dataset'} borderRight={'1px solid black'}>
        <Box h="full" overflowY={'scroll'}>
          <DatasetPanel taxonomy={project} />
          <Filters
            dataset={dataset}
            filters={filters}
            setFilters={setFilters}
          />
          <LabelUpdater
            neighbors={neighbors.filter((el, idx) => neighborsIdx[idx])}
            galleryItems={galleryCandidates}
          />
        </Box>
      </GridItem>
      <GridItem area="projection">
        <ProjectionPanel
          project={project}
          data={dataset.data}
          propagateDataLoad={handleOnLoadData}
          setPointInterest={setPointInterest}
          neighborhoodHull={neighborsConvexHull}
          setBrushedData={setBrushedData}
          filters={filters}
        />
      </GridItem>
      <GridItem area="thumbnails">
        <Neighborhood
          data={dataset.data}
          pointInterest={pointInterest}
          neighbors={neighbors}
          selectedIndexes={neighborsIdx}
          setNumNeighbors={setNumNeighbors}
          setNeighborsIdx={setNeighborsIdx}
          classifier={classifier ? classifier : ''}
          labels={dataset.labels}
        />
      </GridItem>
      <GridItem area="gallery">
        <Gallery
          data={dataset.data}
          size={120}
          brushedData={brushedData}
          setGalleryCandidates={setGalleryCandidates}
          setPointInterest={setPointInterest}
          filters={filters}
        />
      </GridItem>
    </Grid>
  )
}

export default ExplorerPage