""" Module to import content to database after the folders passed through
extraction and segmentation"""

from sys import argv
from argparse import ArgumentParser, Namespace
from content_onboarding.managers.import_manager import ImportManager, Cord19Loader


def parse_args(args) -> Namespace:
    """Parse args from command line"""
    parser = ArgumentParser(prog="DB Importer")
    parser.add_argument(
        "projects_dir", type=str, help="root folder where projects are stored"
    )
    parser.add_argument("project", type=str, help="project name")
    parser.add_argument("metadata", type=str, help="path to metadata")
    parser.add_argument("db", type=str, help="path to .env with db conn")
    # TODO: temp parameter for setting what importer to use
    parser.add_argument(
        "--loader", "-l", type=str, help="metadata loader", default="cord19"
    )
    parsed_args = parser.parse_args(args)

    return parsed_args


def main():
    """main entry"""
    args = parse_args(argv[1:])
    manager = ImportManager(args.project_dir, args.project, args.db)
    loader = Cord19Loader()
    manager.import_content(args.metadata, loader)


if __name__ == "__main__":
    main()
