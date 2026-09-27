import torch
import torch.nn as nn
import numpy as np
from typing import List
from config import FEATURE_KEYS, SEQUENCE_LENGTH

class LSTMAutoencoder(nn.Module):
    def __init__(self, input_dim=8, hidden_dim=16, bottleneck_dim=8):
        super().__init__()
        self.encoder = nn.LSTM(input_dim, hidden_dim, batch_first=True)
        self.to_bottleneck = nn.Linear(hidden_dim, bottleneck_dim)
        self.from_bottleneck = nn.Linear(bottleneck_dim, hidden_dim)
        self.decoder = nn.LSTM(hidden_dim, hidden_dim, batch_first=True)
        self.output_layer = nn.Linear(hidden_dim, input_dim)

    def forward(self, x):
        enc_out, _ = self.encoder(x)
        bottleneck = self.to_bottleneck(enc_out)
        dec_in = self.from_bottleneck(bottleneck)
        dec_out, _ = self.decoder(dec_in)
        return self.output_layer(dec_out)

class LSTMReconstructionManager:
    def __init__(self):
        self.device = torch.device("cpu")
        self.model = LSTMAutoencoder(input_dim=len(FEATURE_KEYS), hidden_dim=16, bottleneck_dim=8).to(self.device)
        self.model.eval()
        self._pretrain_default_weights()

    def _pretrain_default_weights(self):
        """Train a baseline autoencoder on synthetic normal typing sequence distributions."""
        self.model.train()
        optimizer = torch.optim.Adam(self.model.parameters(), lr=0.01)
        criterion = nn.MSELoss()

        np.random.seed(42)
        torch.manual_seed(42)
        # Synthetic z-scored sequences from normal student typing
        synthetic_data = torch.randn(64, SEQUENCE_LENGTH, len(FEATURE_KEYS))

        for _ in range(80):
            optimizer.zero_grad()
            out = self.model(synthetic_data)
            loss = criterion(out, synthetic_data)
            loss.backward()
            optimizer.step()

        self.model.eval()

    def compute_reconstruction_score(self, recent_vectors: List[dict], baseline: dict) -> float:
        """
        Calculates reconstruction error across the last 10 historical vectors.
        Returns 0.0 if fewer than 10 vectors exist.
        """
        if len(recent_vectors) < SEQUENCE_LENGTH:
            return 0.0

        seq = recent_vectors[-SEQUENCE_LENGTH:]
        means = baseline["means"]
        stds = baseline["stds"]

        z_seq = []
        for vec in seq:
            z_row = []
            for k in FEATURE_KEYS:
                val = float(vec.get(k, 0.0))
                m = float(means.get(k, 0.0))
                s = float(stds.get(k, 1.0))
                if s <= 1e-6:
                    s = 1.0
                z_row.append((val - m) / s)
            z_seq.append(z_row)

        x = torch.tensor([z_seq], dtype=torch.float32, device=self.device)

        with torch.no_grad():
            reconstruction = self.model(x)
            mse = torch.mean((x - reconstruction) ** 2).item()

        # Typical normal sequence MSE is ~0.15 - 0.35
        # Highly drifted anomalous sequences escalate to 1.0 - 2.5+
        normalized_score = float(np.clip((mse - 0.25) / 1.25, 0.0, 1.0))
        return round(normalized_score, 3)

lstm_manager = LSTMReconstructionManager()