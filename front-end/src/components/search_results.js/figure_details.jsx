import {useState} from 'react'
import {Box, Flex, Text, Center, Button} from '@chakra-ui/react'
import {ImageViewer} from '../image_viewer'
import {Code2Color} from '../../utils/modalityMap'
import ImageBoundingBoxViewer from '../image/image_bbox_viewer'
import useDimensions from 'react-cool-dimensions'

const API_ENDPOINT = process.env.REACT_APP_IMAGES_ENDPOINT
const SUBFIGURES_ENDPOINT = process.env.REACT_APP_SUBIMAGES_ENDPOINT

const EnhancedSurrogate = ({document}) => {
  const [pagePosition, setPagePosition] = useState(0)
  const {observe, height} = useDimensions({
    polyfill: ResizeObserver,
  })

  const handleClickPrevious = pageIdx => {
    const idx = pageIdx === 0 ? document.pages.length - 1 : pageIdx - 1
    setPagePosition(idx)
  }

  const handleClickNext = pageIdx => {
    const idx = pageIdx === document.pages.length - 1 ? 0 : pageIdx + 1
    setPagePosition(idx)
  }

  return (
    <Box w="full" h="full" bgColor="gray.100" p={2}>
      <Flex w="full" h="calc(100% - 24px)" mt={1} ref={observe}>
        {document && (
          <SurrogatePage
            page={document.pages[pagePosition]}
            pageIdx={pagePosition}
            onClickPrevious={handleClickPrevious}
            onClickNext={handleClickNext}
          />
        )}
        {document && height > 0 && (
          <SurrogateFigure
            document={document}
            page={document.pages[pagePosition]}
            maxHeight={height}
            bboxes={document.bboxes}
          />
        )}
      </Flex>
    </Box>
  )
}

const SurrogatePage = ({page, pageIdx, onClickPrevious, onClickNext}) => (
  <Box h="full" w="30%" mr={1}>
    <Box h="calc(100% - 35px)">
      {document && <ImageViewer src={`${API_ENDPOINT}/${page.page_url}`} />}
    </Box>
    <Box w="full" h="35px">
      <Center p={2}>
        <Button
          colorScheme="blue"
          size="sm"
          mr={1}
          onClick={() => onClickPrevious(pageIdx)}
        >
          Prev
        </Button>
        <span>pg.&nbsp;{page.page}</span>
        <Button
          colorScheme="blue"
          size="sm"
          ml={1}
          onClick={() => onClickNext(pageIdx)}
        >
          Next
        </Button>
      </Center>
    </Box>
  </Box>
)

const FigureWBboxes = ({
  documentId,
  pageNumber,
  noFigure,
  subfigures,
  maxH,
  bboxes,
}) => {
  const figureURL = `${SUBFIGURES_ENDPOINT}/${documentId}/${pageNumber}_${noFigure}.jpg`
  const sfBboxes = subfigures.map(sf => ({
    name: sf.name,
    bbox: bboxes[`${pageNumber}_${noFigure}`][sf.name],
    type: sf.type,
    color: Code2Color[sf.type],
  }))

  return (
    <Box minH={`${maxH}px`} maxH={`${maxH}px`} w="full">
      <ImageBoundingBoxViewer img_src={figureURL} bboxes={sfBboxes} />
    </Box>
  )
}

const SurrogateFigure = ({document, page, bboxes, maxHeight}) => {
  const figure = page.figures[0]
  const figureWidth = figure.caption.length > 0 ? 50 : 100

  return (
    <Flex h="full" w="full">
      <Box w={`${figureWidth}%`} minH="calc(100% - 10px)">
        <FigureWBboxes
          pageNumber={figure.page}
          noFigure={figure.no_subfig}
          subfigures={figure.subfigures}
          documentId={document.cord_uid}
          maxH={maxHeight}
          bboxes={bboxes}
        />
      </Box>
      {figureWidth < 100 && (
        <Box
          w={`${100 - figureWidth}%`}
          bgColor="gray.100"
          p={2}
          pb={0}
          overflowY="auto"
        >
          <Text fontSize={'sm'}>{figure.caption}</Text>
        </Box>
      )}
    </Flex>
  )
}

export {EnhancedSurrogate}