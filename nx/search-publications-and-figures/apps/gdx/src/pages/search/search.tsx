import {useReducer} from 'react'
import {Box, Flex, Spacer, Button, useToast} from '@chakra-ui/react'
import {
  RowModalityLegend,
  SearchBar,
  searchReducer,
  initSearchState,
  HorizontalFigureResults,
  HelpQueries,
  Document,
  Page,
} from '@search-publications-and-figures/common-ui'
import {ReactComponent as Taxonomy} from '../../assets/taxonomy.svg'
import {colorsMapper, namesMapper, ddlSearchOptions} from '../../utils/mapper'
import {search, getPageFigureDetails} from '../../api'

/* eslint-disable-next-line */
export interface SearchProps {
  logout: () => void
}

const COLLECTION = process.env.NX_COLLECTION
const IMAGES_BASE_URL = process.env.NX_FIGURES_ENDPOINT
const PDFS_BASE_URL = process.env.NX_PDFS_ENDPOINT

const Search = ({logout}: SearchProps) => {
  const [{documents, isLoading, filterModalities}, dispatch] = useReducer(
    searchReducer,
    initSearchState,
  )
  const toast = useToast()
  const baseModalities = Object.keys(colorsMapper).filter(
    el => !el.includes('.'),
  )

  const getPageUrl = (_document: Document, page: Page) => {
    // gdx docs can ignore any doc prop to determine the page location
    return `${PDFS_BASE_URL}/${page.page_url}`
  }

  const handleSearch = async (
    keywords: string | null,
    startDate: string | null,
    endDate: string | null,
    modalities: string[],
  ) => {
    if (keywords == null) {
      toast({
        position: 'top',
        description: 'Please enter at least one keyword in the search bar',
        duration: 3000,
        isClosable: true,
        status: 'warning',
      })
      return
    }

    const maxDocs = 2000
    dispatch({type: 'START_SEARCH', payload: modalities})
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
    const results = await search(
      keywords,
      COLLECTION,
      startDate,
      endDate,
      maxDocs,
      modalities,
    )
    await sleep(10)
    dispatch({type: 'END_SEARCH', payload: results})
  }

  return (
    <Box className="container" minH="100vh" w="full">
      <Box w="full" h="100px" p={4} pt={2} pb={0} zIndex={400}>
        <Flex w="full">
          <RowModalityLegend
            modalities={baseModalities}
            colorsMapper={colorsMapper}
            namesMapper={namesMapper}
            taxonomyImage={<Taxonomy />}
          />
          <Spacer />
          <HelpQueries />
          <Button
            backgroundColor={undefined}
            size={'xs'}
            variant="outline"
            onClick={logout}
            ml={1}
          >
            logout
          </Button>
        </Flex>
        <SearchBar
          defaultStartYear={2012}
          defaultEndYear={2016}
          options={ddlSearchOptions}
          colorsMapper={colorsMapper}
          onSearch={handleSearch}
          keywordPlaceholderValue="e.g. disease"
          sampleKeywords={['disease', 'kinase']}
          isLoading={isLoading}
        />
        <Box w="full" mt={2}>
          <HorizontalFigureResults
            documents={documents}
            isLoading={isLoading}
            colorsMapper={colorsMapper}
            namesMapper={namesMapper}
            preferredModalities={filterModalities}
            figuresBaseUrl={IMAGES_BASE_URL}
            getPageFigureData={getPageFigureDetails}
            getPageUrl={getPageUrl}
          />
        </Box>
      </Box>
    </Box>
  )
}

export default Search
