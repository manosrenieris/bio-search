""" Resnet wrapper """

from typing import Optional, List, Dict, Any
import torch
from torch import nn
from torchvision import models
import pytorch_lightning as pl

# import matplotlib.pyplot as plt
from sklearn.metrics import (
    f1_score,
    balanced_accuracy_score,
    recall_score,
    precision_score,
    # confusion_matrix,
    # ConfusionMatrixDisplay,
)


class Resnet(pl.LightningModule):
    """Lightning ResNet wrapper with support to ResNet18, 34, 50, 101, 152"""

    # pylint: disable=unused-argument
    def __init__(
        self,
        classes: List[str],
        num_classes: int,
        name: str = "resnet18",
        pretrained: bool = True,
        fine_tuned_from: str = "whole",
        lr: float = 1e-3,
        metric_monitor: str = "val_loss",
        mode_scheduler: str = "min",
        class_weights: Optional[List[float]] = None,
        mean_dataset: Optional[List[float]] = None,
        std_dataset: Optional[List[float]] = None,
    ):
        super().__init__()
        self.save_hyperparameters(
            "name",
            "classes",
            "num_classes",
            "pretrained",
            "fine_tuned_from",
            "lr",
            "class_weights",
            "metric_monitor",
            "mode_scheduler",
            "mean_dataset",
            "std_dataset",
        )
        self.model = self._get_resnet_model()
        self.set_fine_tuning()

        loss_weight = (
            torch.Tensor(self.hparams.class_weights).to("cuda")
            if class_weights is not None
            else None
        )
        self.loss = nn.CrossEntropyLoss(weight=loss_weight)

    # pylint: disable=arguments-differ
    def forward(self, imgs):
        """Forward function that is run when visualizing the graph"""
        return self.model(imgs)

    def training_step(self, batch, batch_idx) -> float:
        # batch_idx needs to be as a parameter to match signature
        imgs, labels = batch
        preds = self.model(imgs)
        loss = self.loss(preds, labels)
        acc = (preds.argmax(dim=-1) == labels).float().mean()

        self.log("train_acc", acc, on_step=False, on_epoch=True)
        self.log("train_loss", loss, on_step=False, on_epoch=True)
        return loss

    def validation_step(self, batch, batch_idx) -> float:
        # batch_idx needs to be as a parameter to match signature
        imgs, labels = batch
        preds = self.model(imgs)
        loss = self.loss(preds, labels)
        acc = (preds.argmax(dim=-1) == labels).float().mean()
        self.log("val_acc", acc, on_step=False, on_epoch=True)
        self.log("val_loss", loss, on_step=False, on_epoch=True)
        return loss

    def test_step(self, batch, batch_idx):
        # batch_idx needs to be as a parameter to match signature
        imgs, labels = batch
        preds = self.model(imgs)
        # loss = self.loss(y_hat, y_true)
        # _, preds = torch.max(y_hat, dim=1)
        acc = (preds.argmax(dim=-1) == labels).float().mean()
        self.log("test_acc", acc, on_step=False, on_epoch=True)
        # return {"loss": loss, "test_preds": preds, "test_trues": y_true}

    # def test_epoch_end(self, outputs):
    #     avg_loss = torch.stack([x["loss"] for x in outputs]).mean()
    #     y_preds = torch.stack([vec.float() for x in outputs for vec in x["test_preds"]])
    #     y_trues = torch.stack([vec.float() for x in outputs for vec in x["test_trues"]])
    #     accuracy = 100 * torch.sum(y_preds == y_trues.data) / (y_trues.shape[0] * 1.0)

    #     # fig, axis = plt.subplots(figsize=(4, 4))
    #     # cm = confusion_matrix(y_trues.cpu(), y_preds.cpu())
    #     # disp = ConfusionMatrixDisplay(confusion_matrix=cm)
    #     # if self.logger:
    #     #     self.logger.experiment.log({"confusion_matrix": fig})

    #     test_f1 = f1_score(y_trues.cpu(), y_preds.cpu(), average="macro")
    #     balanced_acc = balanced_accuracy_score(y_trues.cpu(), y_preds.cpu())
    #     recall = recall_score(y_trues.cpu(), y_preds.cpu(), average="macro")
    #     precision = precision_score(y_trues.cpu(), y_preds.cpu(), average="macro")

    #     self.log("test_acc", accuracy)
    #     self.log("test_loss", avg_loss)
    #     self.log("macro_f1", test_f1)
    #     self.log("balanced_acc", balanced_acc)
    #     self.log("recall", recall)
    #     self.log("precision", precision)

    def configure_optimizers(self):
        if self.hparams.mode_scheduler is None:
            optimizer = torch.optim.Adam(self.parameters(), lr=self.hparams.lr)
            return optimizer

        optimizer = torch.optim.Adam(self.parameters(), lr=self.hparams.lr)
        scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
            optimizer,
            mode=self.hparams.mode_scheduler,
            patience=3,  # Patience for the Scheduler
            verbose=True,
        )
        return {
            "optimizer": optimizer,
            "lr_scheduler": scheduler,
            "monitor": self.hparams.metric_monitor,
        }

    def _get_resnet_model(self):
        if self.hparams.name == "resnet18":
            if self.hparams.pretrained:
                model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
            else:
                model = models.resnet18(weights=None)
        elif self.hparams.name == "resnet34":
            if self.hparams.pretrained:
                model = models.resnet34(weights=models.ResNet34_Weights.DEFAULT)
            else:
                model = models.resnet34(weights=None)
        elif self.hparams.name == "resnet50":
            if self.hparams.pretrained:
                model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
            else:
                model = models.resnet50(weights=None)
        elif self.hparams.name == "resnet101":
            if self.hparams.pretrained:
                model = models.resnet101(weights=models.ResNet101_Weights.DEFAULT)
            else:
                model = models.resnet101(weights=None)
        elif self.hparams.name == "resnet152":
            if self.hparams.pretrained:
                model = models.resnet152(weights=models.ResNet152_Weights.DEFAULT)
            else:
                model = models.resnet152(weights=None)
        else:
            raise Exception(f"{self.hparams.name} model not supported")
        # retarget the number of classes

        num_ftrs = model.fc.in_features
        model.fc = nn.Linear(num_ftrs, self.hparams.num_classes)
        return model

    def set_fine_tuning(self):
        """Freeze the layers to update"""
        # by default set all to false
        for param in self.model.parameters():
            param.requires_grad = False
        # case for retraining everything
        if self.hparams.fine_tuned_from == "whole":
            for param in self.model.parameters():
                param.requires_grad = True
            return

        # always train parameters in the fully connected layer
        for param in self.model.fc.parameters():
            param.requires_grad = True
        # TODO: this seems like a mistake
        if self.hparams.fine_tuned_from == "fc":
            return

    def feature_extraction(self):
        features = nn.Sequential(*list(self.model.children())[:-1])
        return features
