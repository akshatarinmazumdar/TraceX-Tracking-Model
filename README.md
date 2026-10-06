# TraceX-Tracking-Model

TraceX is an AI-powered surveillance and tracking project that uses computer vision and face recognition to identify and track people in video footage.

## Model weights & dependencies

Large TensorFlow shared libraries and face-recognition model weights are intentionally excluded from Git and remain on the local computer.

- TensorFlow libraries such as `libtensorflow_cc.so.2` and `libtensorflow_framework.so.2` are not committed. Install the version used by the project with `pip install tensorflow`.
- `arcface_weights.h5` and `retinaface.h5` are not committed. DeepFace downloads them automatically when the required model is first used.
- If the weights are not downloaded automatically, place them in `~/.deepface/weights/` or in the folder expected by the installed DeepFace version. The project code also expects the local cache under the user's home directory.

The repository must not contain files larger than 100 MB. Before committing, verify the staged files with `git status`, `git ls-files`, and the size-check commands provided in the project documentation.
