""" Batch index collection of documents """

from datetime import datetime
from pandas import isnull

# pylint: disable=import-error
from java.nio.file import Paths
from org.apache.lucene.analysis.standard import StandardAnalyzer
from org.apache.lucene.index import IndexWriter, IndexWriterConfig
from org.apache.lucene.store import SimpleFSDirectory
from org.apache.lucene.document import (
    Document,
    Field,
    TextField,
    LongPoint,
    StringField,
)


def date2long(date):
    """convert cord19 datetime format to long int for lucene"""
    if len(date) == 4:
        # only year
        parsed = int(f"{date}0101")
    else:
        # year-month-day
        parsed = int(datetime.strptime(date, "%Y-%m-%d").strftime("%Y%m%d"))
    return parsed


class Indexer:
    """
    arguments:
    @store_path: location where to store the indexes
    @create_mode: True for creating new indexes to store. False for appending
    """

    def __init__(self, store_path: str, create_mode=False):
        self.store_path = store_path
        self.create_mode = create_mode

    def __create_index_writer(self, store: SimpleFSDirectory) -> IndexWriter:
        analyzer = StandardAnalyzer()
        config = IndexWriterConfig(analyzer)
        if self.create_mode:
            config.setOpenMode(IndexWriterConfig.OpenMode.CREATE)
        index_writer = IndexWriter(store, config)
        return index_writer

    def index_from_dataframe(self, dataframe, split_term=" "):
        """index elements in dataframe"""
        fields = {
            "docId": StringField.TYPE_STORED,
            "source": StringField.TYPE_STORED,
            "title": TextField.TYPE_STORED,
            "abstract": TextField.TYPE_STORED,
            "pub_date": LongPoint,
            "journal": StringField.TYPE_STORED,
            "authors": TextField.TYPE_STORED,
            "url": StringField.TYPE_STORED,
            "pmcid": StringField.TYPE_STORED,
            "modalities": StringField.TYPE_STORED,
            "num_figures": StringField.TYPE_STORED
        }

        store = SimpleFSDirectory(Paths.get(self.store_path))
        writer = self.__create_index_writer(store)

        try:
            for (
                _,
                row,
            ) in dataframe.iterrows():
                document = Document()
                for key, val in fields.items():
                    if key == "pub_date":
                        date_millis = date2long(row[key])
                        document.add(LongPoint(key, date_millis))
                        document.add(
                            Field("publish", row[key], StringField.TYPE_STORED)
                        )
                    elif key == "modalities":
                        if isnull(row["modalities"]):
                            modalities = []
                        else:
                            modalities = row["modalities"].split(split_term)
                        for mod in modalities:
                            document.add(
                                Field("modality", mod, StringField.TYPE_STORED)
                            )
                    else:
                        document.add(Field(key, row[key], val))
                writer.addDocument(document)
                # TODO: do i need to raise an exception here?
        finally:
            writer.close()
            store.close()
