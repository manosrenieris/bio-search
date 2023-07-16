import {useState, useEffect} from 'react'
import {LuceneDocument, LuceneCaption} from '../../types/lucene-document'
import {Document, Page} from '../../types/document'
import {Box, Flex, chakra, Button} from '@chakra-ui/react'
import SimpleResultCard from '../../simple-result-card/simple-result-card'
import FiguresPerPageViewer from '../../figures-per-page-viewer/figures-per-page-viewer'

const SearchingFeedback = () => <Box mb={2}>Searching...</Box>
const NumberResults = ({numberResults}: {numberResults: number}) => {
  let message = `${numberResults} documents found`
  if (numberResults === 2000) {
    message = 'More than 2000 documents found, showing the first 2000'
  }
  return <Box mb={2}>{message}</Box>
}

/* eslint-disable-next-line */
interface PagButtonProps {
  selected: boolean
  val: number
  next: number
  onClick: (arg1: number) => void
}

const PagButton = ({selected, val, next, onClick}: PagButtonProps) => (
  <Button
    colorScheme={selected ? 'blue' : 'gray'}
    onClick={() => {
      onClick(next)
    }}
    mr={2}
  >
    {val}
  </Button>
)

/* eslint-disable-next-line */
interface PaginationProps {
  currPage: number
  numberPages: number
  onClick: (arg1: number) => void
}

const Pagination = ({currPage, numberPages, onClick}: PaginationProps) => {
  const nextPage = currPage < numberPages ? currPage + 1 : -1
  const defaultParams = {selected: false, onClick}

  return (
    <Flex w="full" mt={2} alignItems="center" justifyContent="center">
      {currPage > 1 && (
        <>
          <PagButton {...defaultParams} val={1} next={0} />
          <p>...</p>
        </>
      )}
      {currPage > 0 && (
        <PagButton {...defaultParams} val={currPage} next={currPage - 1} />
      )}
      <PagButton
        {...defaultParams}
        selected={true}
        val={currPage + 1}
        next={currPage}
      />
      {nextPage > 0 && nextPage < numberPages && (
        <PagButton {...defaultParams} val={currPage + 2} next={currPage + 1} />
      )}

      {numberPages > 1 && currPage < numberPages - 2 && (
        <>
          <chakra.p mr={2}>...</chakra.p>

          <PagButton
            {...defaultParams}
            val={numberPages}
            next={numberPages - 1}
          />
        </>
      )}
    </Flex>
  )
}

/* eslint-disable-next-line */
export interface HorizontalResultCardProps {
  document: LuceneDocument
  colorsMapper: {[id: string]: string}
  namesMapper: {[id: string]: string}
  figuresBaseUrl: string
  preferredModalities: string[]
  getPageFigureData: (arg1: string, arg2: string[]) => Promise<Document>
  getPageUrl: (arg1: Document, arg2: Page) => string
}

export const HorizontalResultCard = ({
  document,
  colorsMapper,
  namesMapper,
  figuresBaseUrl,
  preferredModalities,
  getPageFigureData,
  getPageUrl,
}: HorizontalResultCardProps) => {
  const [docFigureInfo, setDocFigureInfo] = useState<Document | null>(null)

  useEffect(() => {
    const load = async () => {
      // not using the modality count to rank
      // const filteredModalities = Object.keys(document.modalities_count).filter(
      //   el => preferredModalities.includes(el),
      // )
      // const preferredOrder = filteredModalities
      //   .map(el => ({
      //     modality: el,
      //     count: document.modalities_count[el],
      //   }))
      //   .sort((a, b) => b.count - a.count)
      //   .map(el => el.modality)
      const details = await getPageFigureData(
        document.id.toString(),
        preferredModalities,
      )
      setDocFigureInfo(details)
    }

    if (docFigureInfo === null) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document.id])

  return (
    <Flex direction={'row'} h="300px" mb={4}>
      <Box w="40%" h="100%">
        {docFigureInfo && (
          <SimpleResultCard
            document={document}
            onClick={null}
            colorMapper={colorsMapper}
            namesMapper={namesMapper}
            selected={false}
          />
        )}
      </Box>
      <Box w="60%" h="100%" pl={2}>
        {docFigureInfo && (
          <FiguresPerPageViewer
            document={docFigureInfo}
            colorsMapper={colorsMapper}
            figuresBaseUrl={figuresBaseUrl}
            getPageUrl={getPageUrl}
            captionHits={document.captions}
          />
        )}
      </Box>
    </Flex>
  )
}

/* eslint-disable-next-line */
export interface HorizontalFigureResultsProps {
  documents: LuceneDocument[] | null
  isLoading: boolean
  colorsMapper: {[id: string]: string}
  namesMapper: {[id: string]: string}
  figuresBaseUrl: string
  preferredModalities: string[]
  getPageFigureData: (arg1: string, arg2: string[]) => Promise<Document>
  getPageUrl: (arg1: Document, arg2: Page) => string
}

export function HorizontalFigureResults({
  documents,
  isLoading,
  colorsMapper,
  namesMapper,
  figuresBaseUrl,
  preferredModalities,
  getPageFigureData,
  getPageUrl,
}: HorizontalFigureResultsProps) {
  const resultsPerPage = 10
  const [currPage, setCurrPage] = useState(0)
  const [numberPages, setNumberPages] = useState<number>(0)
  const [slicedResults, setSlicedResults] = useState<LuceneDocument[] | null>(
    null,
  )

  useEffect(() => {
    setCurrPage(0)
    if (documents) {
      setNumberPages(Math.ceil(documents.length / resultsPerPage))
      setSlicedResults(documents.slice(0, resultsPerPage))
    } else {
      setNumberPages(0)
      setSlicedResults(null)
    }
  }, [documents])

  const handlePaginationOnClick = (pageNumber: number) => {
    if (documents && pageNumber !== currPage) {
      setCurrPage(pageNumber)

      const startIdx = pageNumber * resultsPerPage
      const numberElements =
        pageNumber === numberPages
          ? documents.length - startIdx
          : resultsPerPage
      const endIdx = startIdx + numberElements

      setSlicedResults(documents.slice(startIdx, endIdx))
      window.scrollTo({top: 0, left: 0, behavior: 'smooth'})
    }
  }

  return (
    <Box>
      {isLoading && <SearchingFeedback />}
      {documents && <NumberResults numberResults={documents.length} />}
      {slicedResults &&
        slicedResults.map(document => (
          <>
            <HorizontalResultCard
              key={document.id}
              document={document}
              colorsMapper={colorsMapper}
              namesMapper={namesMapper}
              figuresBaseUrl={figuresBaseUrl}
              preferredModalities={preferredModalities}
              getPageFigureData={getPageFigureData}
              getPageUrl={getPageUrl}
            />
            {/* <Divider key={`divider-${document.id}`} mt={1} mb={1} /> */}
          </>
        ))}
      {documents && documents.length > 0 && (
        <Pagination
          currPage={currPage}
          numberPages={numberPages}
          onClick={handlePaginationOnClick}
        />
      )}
    </Box>
  )
}

export default HorizontalFigureResults
